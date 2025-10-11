import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Card,
  Row,
  Col,
  message,
  Upload,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UploadOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";

const { Option } = Select;
const { TextArea } = Input;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scannedData, setScannedData] = useState(null);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB"); // Format: DD/MM/YYYY
    } catch (e) {
      return dateString;
    }
  };

  // Function to scan CCCD using AI
  const scanCCCD = async (files) => {
    if (files.length < 2) {
      message.error("Please upload both front and back images of your CCCD.");
      return;
    }

    setIsScanning(true);
    try {
      message.loading("Scanning CCCD...", 0);

      console.log("Files to scan:", files);

      // Try to scan front side first
      const frontFormData = new FormData();
      const frontFile = files[0].originFileObj || files[0];
      frontFormData.append("file", frontFile);

      console.log(
        "Scanning front side:",
        frontFile.name,
        "Size:",
        frontFile.size,
        "Type:",
        frontFile.type
      );

      let frontResponse;
      try {
        frontResponse = await api.post("/auth/identity-card", frontFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Front side response:", frontResponse.data);
      } catch (frontError) {
        console.error("Front side scan failed:", frontError.response?.data);
        console.error("Front side error status:", frontError.response?.status);
        console.error(
          "Front side error headers:",
          frontError.response?.headers
        );
        throw frontError; // Re-throw to handle properly
      }

      // Try to scan back side
      const backFormData = new FormData();
      const backFile = files[1].originFileObj || files[1];
      backFormData.append("file", backFile);

      console.log(
        "Scanning back side:",
        backFile.name,
        "Size:",
        backFile.size,
        "Type:",
        backFile.type
      );

      let backResponse;
      try {
        backResponse = await api.post("/auth/identity-card", backFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Back side response:", backResponse.data);
      } catch (backError) {
        console.error("Back side scan failed:", backError.response?.data);
        console.error("Back side error status:", backError.response?.status);
        console.error("Back side error headers:", backError.response?.headers);
        throw backError; // Re-throw to handle properly
      }

      message.destroy();

      // Extract data from responses
      const frontData = frontResponse.data?.data || frontResponse.data || {};
      const backData = backResponse.data?.data || backResponse.data || {};

      console.log("Front side extracted data:", frontData);
      console.log("Back side extracted data:", backData);

      // Combine data from both sides
      // Smart merge: prioritize non-empty values, don't let "N/A" overwrite real data
      const combinedData = {};

      // First add all front data
      Object.keys(frontData).forEach((key) => {
        const value = frontData[key];
        if (value && value !== "N/A" && value !== "undefined") {
          combinedData[key] = value;
        }
      });

      // Then add back data, but only if field is empty or doesn't exist
      Object.keys(backData).forEach((key) => {
        const value = backData[key];
        if (value && value !== "N/A" && value !== "undefined") {
          // Only add if field doesn't exist yet OR existing value is N/A
          if (!combinedData[key] || combinedData[key] === "N/A") {
            combinedData[key] = value;
          }
        }
      });

      // Validate that we got some essential data from API
      if (Object.keys(combinedData).length === 0) {
        throw new Error(
          "Unable to extract information from CCCD. Please ensure images are clear and readable."
        );
      }

      console.log("Final combined data:", combinedData);

      // Validate essential fields
      const missingFields = [];
      if (!combinedData.fullName) missingFields.push("Full Name");
      if (!combinedData.idNumber) missingFields.push("ID Number");
      if (!combinedData.dateOfBirth) missingFields.push("Date of Birth");

      if (missingFields.length > 0) {
        console.warn("Missing essential fields:", missingFields);
        toast.warning(
          `CCCD scanned but missing: ${missingFields.join(
            ", "
          )}. Please verify the information.`
        );
      } else {
        toast.success("CCCD scanned successfully! All information extracted.");
      }

      setScannedData(combinedData);

      return combinedData;
    } catch (error) {
      message.destroy();
      console.error("Scan error details:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "CCCD scan failed. Please try again.";
      if (error.response?.status === 400) {
        errorMessage =
          "Unable to scan CCCD. Please ensure images are clear and show complete CCCD.";
      }

      toast.error(errorMessage);
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const onFinish = async (values) => {
    // Validate that both ID images are present and scanned
    if (uploadedFiles.length < 2) {
      message.error("Please upload both front and back images of your CCCD.");
      return;
    }

    if (!scannedData) {
      message.error("Please scan your CCCD first.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Add all form fields including scanned data
      formData.append("fullName", scannedData.fullName || "");
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("phone", values.phone);
      formData.append("dateOfBirth", scannedData.dateOfBirth || "");

      // Fix gender logic: properly check gender value
      const genderValue = scannedData.gender || "";
      if (
        genderValue === "true" ||
        genderValue === "Male" ||
        genderValue === "Nam" ||
        genderValue === "male"
      ) {
        formData.append("gender", "true");
      } else if (
        genderValue === "false" ||
        genderValue === "Female" ||
        genderValue === "Nữ" ||
        genderValue === "female"
      ) {
        formData.append("gender", "false");
      } else {
        // Default to true (Male) if gender is unclear
        formData.append("gender", "true");
      }

      formData.append("idNumber", scannedData.idNumber || "");
      formData.append("issueDate", scannedData.issueDate || "");
      formData.append("expiryDate", scannedData.expiryDate || "");
      formData.append("placeOfIssue", scannedData.placeOfIssue || "");
      formData.append("placeOfBirth", scannedData.placeOfBirth || "N/A");
      formData.append("address", scannedData.address || "");

      // Add uploaded files
      // Note: First file should be FRONT (with photo), second file should be BACK (with chip)
      uploadedFiles.forEach((file, index) => {
        const fileObj = file.originFileObj || file;
        console.log(
          `Appending file ${index}:`,
          fileObj.name,
          fileObj.type,
          fileObj.size
        );
        if (index === 0) {
          formData.append("frontImage", fileObj);
        } else if (index === 1) {
          formData.append("backImage", fileObj);
        }
      });

      // Debug: Log all formData entries
      console.log("FormData being sent:");
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], ":", pair[1].name);
        } else {
          console.log(pair[0], ":", pair[1]);
        }
      }

      message.loading("Creating your account...", 0);
      const response = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy();
      toast.success("Successfully created new account!");
      
      // Save email to localStorage as fallback
      localStorage.setItem("email", values.email);
      navigate("/verify-otp", { state: { email: values.email } });
      console.log(response);
    } catch (e) {
      message.destroy();
      console.error(e);
      message.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Background */}
      <div className="register-background"></div>

      <div className="register-card-container">
        <Card className="register-card">
          <div className="register-header">
            <h2 className="register-title">Join Our Community</h2>
            <p className="register-subtitle">
              Start your electric vehicle co-ownership journey today.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="register-form"
          >
            <Row gutter={20}>
              {/* Email */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    {
                      validator: (_, v) =>
                        !v || validateEmail(v)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Please enter a valid email")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter your email address"
                    type="email"
                    prefix={<MailOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Phone */}
              <Col span={24}>
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[
                    { required: true, message: "Phone number is required" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "Phone must contain only numbers",
                    },
                    { min: 10, message: "Phone must be at least 10 digits" },
                  ]}
                >
                  <Input
                    placeholder="Enter your phone number"
                    prefix={<PhoneOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Password is required" },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Create a password (min 8 chars)"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>

              {/* Confirm Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm Password"
                  name="confirmPassword"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Confirm your password"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* CCCD Upload Section */}
            <div className="upload-section">
              <h3
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: "#1f2937",
                }}
              >
                CCCD Verification
              </h3>
              <div className="upload-item">
                <Upload
                  accept=".png,.jpg,.jpeg"
                  multiple
                  maxCount={2}
                  beforeUpload={(file) => {
                    const isPng = file.type === "image/png";
                    const isJpeg =
                      file.type === "image/jpeg" ||
                      file.type === "image/jpg" ||
                      /\.jpe?g$/i.test(file.name);
                    if (!isPng && !isJpeg) {
                      message.error(`${file.name} must be PNG or JPG/JPEG.`);
                      return Upload.LIST_IGNORE;
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error("Image must be smaller than 5MB!");
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                  fileList={uploadedFiles}
                  onRemove={(file) => {
                    const newList = uploadedFiles.filter(
                      (f) => f.uid !== file.uid
                    );
                    setUploadedFiles(newList);
                    if (newList.length < 2) {
                      setScannedData(null);
                    }
                  }}
                  onChange={(info) => {
                    let list = info.fileList || [];
                    list = list.filter((f) => {
                      const t = f.type || "";
                      const name = f.name || "";
                      const isP = t === "image/png";
                      const isJ =
                        t === "image/jpeg" ||
                        t === "image/jpg" ||
                        /\.jpe?g$/i.test(name);
                      return isP || isJ;
                    });
                    if (list.length > 2) list = list.slice(list.length - 2);
                    setUploadedFiles(list);

                    // Reset scanned data when files change
                    setScannedData(null);
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    Upload CCCD Images (2 files)
                  </Button>
                </Upload>

                {/* Manual Scan Button */}
                {uploadedFiles.length === 2 && (
                  <div style={{ marginTop: "10px", textAlign: "center" }}>
                    <Button
                      type="primary"
                      icon={<IdcardOutlined />}
                      loading={isScanning}
                      onClick={() => {
                        const files = uploadedFiles.map(
                          (file) => file.originFileObj || file
                        );
                        scanCCCD(files);
                      }}
                      style={{ marginTop: "10px" }}
                    >
                      {isScanning ? "Scanning CCCD..." : "Scan CCCD"}
                    </Button>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      Click to scan and extract information from your CCCD
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <Form.Item
              name="agree"
              valuePropName="checked"
              className="register-terms-checkbox"
              rules={[
                {
                  validator: (_, v) =>
                    v
                      ? Promise.resolve()
                      : Promise.reject(new Error("You must accept the Terms.")),
                },
              ]}
            >
              <Checkbox>
                I agree to the{" "}
                <Link to="/terms" className="register-terms-link">
                  Co-ownership Terms &amp; Privacy Policy
                </Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                className="register-submit-button"
                disabled={!scannedData}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </Form.Item>

            <div className="register-login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </Form>
        </Card>
      </div>

      {/* Independent CCCD Info Table */}
      <div className={`cccd-info-table ${!scannedData ? "hidden" : ""}`}>
        <div className="cccd-info-header">
          <h3>📋 Identify card Information</h3>
        </div>
        {scannedData && (
          <div className="cccd-info-grid">
            <div className="cccd-info-item">
              <span className="cccd-info-label">Full Name:</span>
              <span className="cccd-info-value">{scannedData.fullName}</span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">ID Number:</span>
              <span className="cccd-info-value">{scannedData.idNumber}</span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Date of Birth:</span>
              <span className="cccd-info-value">
                {formatDate(scannedData.dateOfBirth)}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Gender:</span>
              <span className="cccd-info-value">
                {scannedData.gender === true ||
                scannedData.gender === "true" ||
                scannedData.gender === "Male" ||
                scannedData.gender === "Nam"
                  ? "Male"
                  : scannedData.gender === false ||
                    scannedData.gender === "false" ||
                    scannedData.gender === "Female" ||
                    scannedData.gender === "Nữ"
                  ? "Female"
                  : scannedData.gender}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Place of Birth:</span>
              <span className="cccd-info-value">
                {scannedData.placeOfBirth || "N/A"}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Address:</span>
              <span className="cccd-info-value">
                {scannedData.address || "N/A"}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Issue Date:</span>
              <span className="cccd-info-value">
                {formatDate(scannedData.issueDate)}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Expiry Date:</span>
              <span className="cccd-info-value">
                {formatDate(scannedData.expiryDate)}
              </span>
            </div>
            <div className="cccd-info-item">
              <span className="cccd-info-label">Place of Issue:</span>
              <span className="cccd-info-value">
                {scannedData.placeOfIssue || "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
