import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Col, Row, Upload } from "antd";
import {
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";

const UpdateProfile = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend] = useState(false);
  const [email, setEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get profile data from navigation state first
        const profileData = location.state?.profileData;
        const emailFromState = location.state?.email;
        const emailFromStorage = localStorage.getItem("email");

        if (profileData) {
          // Use profile data from navigation state
          form.setFieldsValue({
            email: profileData.email,
            phone: profileData.phone,
            fullName: profileData.fullName,
            address: profileData.address,
            dateOfBirth: profileData.dateOfBirth
              ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
              : undefined,
            gender: profileData.gender,
            idNumber: profileData.idNumber,
            placeOfBirth: profileData.placeOfBirth,
            issueDate: profileData.issueDate
              ? new Date(profileData.issueDate).toISOString().split("T")[0]
              : undefined,
            expiryDate: profileData.expiryDate
              ? new Date(profileData.expiryDate).toISOString().split("T")[0]
              : undefined,
            placeOfIssue: profileData.placeOfIssue,
          });
          setEmail(profileData.email);
        } else {
          // Try to fetch profile data from API
          const token = localStorage.getItem("token")?.replaceAll('"', "");
          if (token) {
            console.log("Fetching profile data from API...");
            const response = await api.get("/settings/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && response.data.data) {
              const apiProfileData = response.data.data;
              console.log("Profile data from API:", apiProfileData);

              form.setFieldsValue({
                email: apiProfileData.email,
                phone: apiProfileData.phone,
                fullName: apiProfileData.fullName,
                address: apiProfileData.address,
                dateOfBirth: apiProfileData.dateOfBirth
                  ? new Date(apiProfileData.dateOfBirth)
                      .toISOString()
                      .split("T")[0]
                  : undefined,
                gender: apiProfileData.gender,
                idNumber: apiProfileData.idNumber,
                placeOfBirth: apiProfileData.placeOfBirth,
                issueDate: apiProfileData.issueDate
                  ? new Date(apiProfileData.issueDate)
                      .toISOString()
                      .split("T")[0]
                  : undefined,
                expiryDate: apiProfileData.expiryDate
                  ? new Date(apiProfileData.expiryDate)
                      .toISOString()
                      .split("T")[0]
                  : undefined,
                placeOfIssue: apiProfileData.placeOfIssue,
              });
              setEmail(apiProfileData.email);
            }
          } else {
            // Fallback for email-only flow (from register/verify-otp)
            const emailToUse = emailFromState || emailFromStorage;
            if (emailToUse) {
              setEmail(emailToUse);
              form.setFieldsValue({ email: emailToUse });
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        // Fallback to email only
        const emailFromState = location.state?.email;
        const emailFromStorage = localStorage.getItem("email");
        const emailToUse = emailFromState || emailFromStorage;
        if (emailToUse) {
          setEmail(emailToUse);
          form.setFieldsValue({ email: emailToUse });
        }
      }
    };

    loadProfileData();
  }, [location.state, form]);

  // Handle browser back button
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there are unsaved changes
      const hasUnsavedChanges =
        uploadedFiles.length > 0 || form.isFieldsTouched();
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      // When user presses back button, navigate with updated data
      const updatedProfileData = localStorage.getItem("profileData");
      if (updatedProfileData) {
        try {
          const parsedData = JSON.parse(updatedProfileData);
          navigate("/", {
            state: {
              profileData: parsedData,
              email: parsedData.email,
              updated: true,
            },
            replace: true,
          });
        } catch (error) {
          console.error("Error parsing profile data:", error);
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, uploadedFiles, form]);

  const onFinish = async (values) => {
    setIsLoading(true);

    try {
      // Get email from multiple sources with priority order
      const formEmail = values.email || form.getFieldValue("email");
      const emailState = email;
      const emailFromLocation = location.state?.email;
      const emailFromStorage = localStorage.getItem("email");
      const emailFromProfile = location.state?.profileData?.email;

      // Priority: form value > state > location > storage > profile
      const finalEmail =
        formEmail ||
        emailState ||
        emailFromLocation ||
        emailFromStorage ||
        emailFromProfile;

      if (!finalEmail || finalEmail.trim() === "" || finalEmail === "N/A") {
        message.error("Email not found. Please enter your email address first");
        setIsLoading(false);
        return;
      }

      // Get current phone from form data (loaded from API) or location state
      const currentPhoneFromForm = form.getFieldValue("phone");
      const currentPhoneFromState = location.state?.profileData?.phone;
      const currentPhone =
        currentPhoneFromForm || currentPhoneFromState || "N/A";

      // Get new phone from form input, fallback to current phone if empty
      const phoneNumber =
        values.newPhone && values.newPhone.trim() !== ""
          ? values.newPhone
          : currentPhone !== "N/A"
          ? currentPhone
          : "";

      // Validate OTP
      const otpCode = values["verification-code"];
      if (!otpCode || otpCode.trim() === "") {
        message.error("Verification code (OTP) is required");
        setIsLoading(false);
        return;
      }

      // Validate that we have a phone number to send
      if (!phoneNumber || phoneNumber.trim() === "" || phoneNumber === "N/A") {
        message.error("Phone number is required. Please enter a phone number.");
        setIsLoading(false);
        return;
      }

      // Ensure we have valid data before sending
      const finalEmailToSend =
        values["newEmail"] && values["newEmail"].trim() !== ""
          ? values["newEmail"]
          : finalEmail;
      const finalPhoneToSend =
        values["newPhone"] && values["newPhone"].trim() !== ""
          ? values["newPhone"]
          : phoneNumber;

      // Additional validation
      if (!finalEmailToSend || finalEmailToSend.trim() === "") {
        message.error("Email is required");
        setIsLoading(false);
        return;
      }

      if (!finalPhoneToSend || finalPhoneToSend.trim() === "") {
        message.error("Phone number is required");
        setIsLoading(false);
        return;
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("email", finalEmailToSend);
      formData.append("phone", finalPhoneToSend);

      // Add uploaded images if available
      if (uploadedFiles && uploadedFiles.length >= 2) {
        // Determine which file is front and which is back based on filename
        let frontFile, backFile;

        for (let file of uploadedFiles) {
          const fileName = (file.originFileObj || file).name.toLowerCase();
          if (fileName.includes("front")) {
            frontFile = file.originFileObj || file;
          } else if (fileName.includes("back")) {
            backFile = file.originFileObj || file;
          }
        }

        // Fallback: if no front/back in filename, use order
        if (!frontFile || !backFile) {
          frontFile = uploadedFiles[0].originFileObj || uploadedFiles[0];
          backFile = uploadedFiles[1].originFileObj || uploadedFiles[1];
        }

        console.log("=== FILE ASSIGNMENT DEBUG ===");
        console.log("Front file:", frontFile?.name);
        console.log("Back file:", backFile?.name);

        if (frontFile) {
          formData.append("frontImage", frontFile);
          formData.append("frontImageType", "chip_front"); // Specify image type
        }
        if (backFile) {
          formData.append("backImage", backFile);
          formData.append("backImageType", "chip_back"); // Specify image type
        }
      }

      console.log("=== UPDATE PROFILE DEBUG ===");
      console.log("Form values:", values);
      console.log("Final email:", finalEmail);
      console.log("Final phone:", phoneNumber);
      console.log("Current phone from form:", currentPhoneFromForm);
      console.log("Current phone from state:", currentPhoneFromState);
      console.log("Email to send:", finalEmailToSend);
      console.log("Phone to send:", finalPhoneToSend);
      console.log("OTP code:", otpCode);
      console.log("Uploaded files:", uploadedFiles);

      // Debug FormData contents
      console.log("=== FORMDATA DEBUG ===");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Build API URL with OTP as query parameter
      const apiUrl = `/settings/profile/otp?otp=${encodeURIComponent(otpCode)}`;

      console.log("API URL:", apiUrl);

      message.loading("Changing profile...", 0);

      const response = await api.put(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy();

      // Check if response is successful
      if (response.status === 200 || response.status === 201) {
        toast.success("Update profile successfully!");
        console.log("Profile updated successfully:", response.data);

        // Fetch updated profile data from API
        try {
          const token = localStorage.getItem("token")?.replaceAll('"', "");
          if (token) {
            console.log("Fetching updated profile data...");
            const profileResponse = await api.get("/settings/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (profileResponse.data && profileResponse.data.data) {
              const updatedProfileData = profileResponse.data.data;
              console.log("Updated profile data from API:", updatedProfileData);

              // Update localStorage with fresh data from API
              localStorage.setItem(
                "profileData",
                JSON.stringify(updatedProfileData)
              );

              // Update location state for back navigation
              if (location.state) {
                location.state.profileData = updatedProfileData;
                location.state.email = updatedProfileData.email;
              }

              // Show success message with option to go back
              message.success({
                content:
                  "Profile updated successfully! You can now go back to see your updated information.",
                duration: 5,
              });
            } else {
              throw new Error("No profile data received from API");
            }
          } else {
            throw new Error("No authentication token found");
          }
        } catch (profileError) {
          console.error("Error fetching updated profile:", profileError);
          // Fallback: use response data if available
          const updatedProfileData = {
            email: finalEmailToSend,
            phone: finalPhoneToSend,
            ...(response.data?.data || {}),
            ...(location.state?.profileData || {}),
          };
          localStorage.setItem(
            "profileData",
            JSON.stringify(updatedProfileData)
          );

          message.success({
            content:
              "Profile updated successfully! You can now go back to see your updated information.",
            duration: 5,
          });
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      message.destroy();
      console.error("=== UPDATE PROFILE ERROR ===");
      console.error("Error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "Update profile failed. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Invalid Verification Code. Please check and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please double check again.";
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setIsResendDisabled(true);
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

      // Try to scan front side first
      const frontFormData = new FormData();
      const frontFile = files[0].originFileObj || files[0];
      frontFormData.append("file", frontFile);

      let frontResponse;
      try {
        frontResponse = await api.post("/auth/identity-card", frontFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (frontError) {
        console.error(
          "Front side scan failed:",
          frontError.response?.data?.message
        );
        throw frontError; // Re-throw to handle properly
      }

      // Try to scan back side
      const backFormData = new FormData();
      const backFile = files[1].originFileObj || files[1];
      backFormData.append("file", backFile);

      let backResponse;
      try {
        backResponse = await api.post("/auth/identity-card", backFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (backError) {
        console.error(
          "Back side scan failed:",
          backError.response?.data?.message
        );
        throw backError; // Re-throw to handle properly
      }

      message.destroy();

      // Extract data from responses
      const frontData = frontResponse.data?.data || frontResponse.data || {};
      const backData = backResponse.data?.data || backResponse.data || {};

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

      // Validate essential fields
      const missingFields = [];
      if (!combinedData.fullName) missingFields.push("Full Name");
      if (!combinedData.idNumber) missingFields.push("ID Number");
      if (!combinedData.dateOfBirth) missingFields.push("Date of Birth");

      if (missingFields.length > 0) {
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
      console.error(
        "CCCD scan error:",
        error.response?.data?.message || error.message
      );

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

  const sendVerificationCode = async () => {
    // Get email from multiple sources with priority order
    const formEmail = form.getFieldValue("email");
    const emailState = email;
    const emailFromLocation = location.state?.email;
    const emailFromStorage = localStorage.getItem("email");
    const emailFromProfile = location.state?.profileData?.email;

    // Priority: form value > state > location > storage > profile
    const currentEmail =
      formEmail ||
      emailState ||
      emailFromLocation ||
      emailFromStorage ||
      emailFromProfile;

    console.log("Sending verification code to:", currentEmail);

    if (!currentEmail || currentEmail.trim() === "" || currentEmail === "N/A") {
      console.error("No valid email found!");
      message.error("Email not found. Please enter your email address first");
      return;
    }
    try {
      message.loading("Sending Verification Code...", 0);

      // API expects email as query parameter, not in request body
      const apiUrl = `/settings/request-profile-update-otp?email=${encodeURIComponent(
        currentEmail
      )}`;

      await api.post(
        apiUrl,
        {},
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      message.destroy();
      toast.success("Activation Code has been resent to your email!");

      // Bắt đầu countdown 60s
      startCountdown();
    } catch (error) {
      message.destroy();
      console.error(
        "Send verification code error:",
        error.response?.data?.message || error.message
      );

      let errorMessage = "Failed to send Activation Code. Please try again.";

      // Check if account is not activated
      if (
        error.response?.status === 403 ||
        error.response?.data?.message?.includes("not activated") ||
        error.response?.data?.message?.includes("inactive")
      ) {
        errorMessage =
          "Your account is not activated yet. Please verify your account first before resetting password.";
        toast.error(errorMessage);
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Bad request. Please check your email.";
        toast.error(errorMessage);
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="verify-container">
      {/* Background */}
      <div className="verify-background"></div>

      <div className="verify-card-container">
        <Card className="verify-card">
          <div className="verify-header">
            <h2 className="verify-title">Setting Your Account</h2>
            <p className="verify-subtitle">
              Please enter the Verification Code sent to your email address to
              create a new password.
            </p>
          </div>

          <Row>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="verify-form"
            >
              {/* Current Email (Read-only) */}
              <Form.Item label="Current Email">
                <Input
                  value={email || "N/A"}
                  prefix={<MailOutlined />}
                  disabled
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>

              {/* New Email */}
              <Form.Item
                label="New Email Address (Optional)"
                name="newEmail"
                rules={[
                  {
                    type: "email",
                    message: "Please enter a valid email address",
                  },
                ]}
              >
                <Input
                  placeholder="Enter your new email address (leave blank to keep current)"
                  type="email"
                  prefix={<MailOutlined />}
                  allowClear
                />
              </Form.Item>

              {/* Current Phone (Read-only) */}
              <Form.Item label="Current Phone Number">
                <Input
                  value={location.state?.profileData?.phone || "N/A"}
                  prefix={<PhoneOutlined />}
                  disabled
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>

              {/* New Phone */}
              <Form.Item
                label="New Phone Number (Optional)"
                name="newPhone"
                rules={[
                  {
                    pattern: /^[0-9]+$/,
                    message: "Phone must contain only numbers",
                  },
                  { min: 10, message: "Phone must be at least 10 digits" },
                ]}
              >
                <Input
                  placeholder="Enter your new phone number (leave blank to keep current)"
                  prefix={<PhoneOutlined />}
                  allowClear
                />
              </Form.Item>
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

              {/* Verification Code */}
              <Form.Item
                label="Verification Code"
                name="verification-code"
                rules={[
                  { required: true, message: "Verification Code is required" },
                  {
                    min: 6,
                    message: "Verification Code must be at least 6 characters",
                  },
                  {
                    max: 6,
                    message: "Verification Code must be exactly 6 characters",
                  },
                  {
                    pattern: /^[0-9]+$/,
                    message: "Verification Code must contain only numbers",
                  },
                ]}
              >
                <Input
                  placeholder="Enter 6-digit Verification Code"
                  type="text"
                  prefix={<SafetyOutlined />}
                  allowClear
                  maxLength={6}
                />
              </Form.Item>
              {/* Resend Activation Code Link */}
              <div className="send-activation-code-container">
                <p>
                  Didn't receive the code?{" "}
                  <Button
                    type="link"
                    onClick={sendVerificationCode}
                    disabled={isResendDisabled}
                    className="send-verification-code-link"
                  >
                    {isResendDisabled
                      ? `Send Verification Code (${countdown}s)`
                      : hasRequestedResend
                      ? "Send Verification Code"
                      : "Send Verification Code"}
                  </Button>
                </p>
              </div>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  onClick={onFinish}
                  block
                  size="large"
                  className="verify-submit-button"
                >
                  {isLoading ? "Verifying..." : "Verify your Account"}
                </Button>
              </Form.Item>
              <div className="verify-login-link">
                <Link
                  to="/"
                  state={{
                    profileData: location.state?.profileData,
                    email: location.state?.email || email,
                    updated: true,
                  }}
                >
                  Back
                </Link>
              </div>
            </Form>
          </Row>
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

export default UpdateProfile;
