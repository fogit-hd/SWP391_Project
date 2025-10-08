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
  UserOutlined,
  MailOutlined,
  LockOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";

const { Option } = Select;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [uuidFiles, setUuidFiles] = useState([]);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const onFinish = async (values) => {
    // Validate that exactly 2 files are present
    if (uuidFiles.length !== 2) {
      message.error(
        "Please upload exactly 2 files for Citizen ID (PNG or PDF)."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Build multipart/form-data
      const formData = new FormData();
      // append scalar fields
      Object.keys(values).forEach((key) => {
        // skip potential file field
        if (key === "UUID") return;
        formData.append(key, values[key]);
      });

      // append uuid files (named uuidFiles[] so backend can read as array)
      uuidFiles.forEach((f) => {
        // use originFileObj (the actual File)
        const fileObj = f.originFileObj || f;
        formData.append("uuidFiles", fileObj);
      });

      const response = await api.post("/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Successfully create new account!");
      navigate("/login");
      console.log(response);
    } catch (e) {
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
            <h2 className="register-title">Join EV CoShare</h2>
            <p className="register-subtitle">Start your electric vehicle co-ownership journey today.</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="register-form"
          >
            <Row gutter={16} className="register-form-row">
              {/* Username */}
              <Col span={24}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: "Username is required" }]}
                >
                  <Input
                    placeholder="Username"
                    prefix={<UserOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Email */}
              <Col span={24}>
                <Form.Item
                  label="Email"
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
                    placeholder="Email address"
                    type="email"
                    prefix={<MailOutlined />}
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
                    placeholder="Password (min 8 chars)"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>

              {/* Confirm Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm password"
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
                    placeholder="Confirm password"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Identity Verification for Co-ownership */}
            <Form.Item
              label="Identity Verification (Required for Co-ownership)"
              name="UUID"
              // custom validator will check uuidFiles state
              rules={[
                {
                  validator: () =>
                    uuidFiles.length === 2
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            "Please upload exactly 2 files (PNG or PDF) for identity verification."
                          )
                        ),
                },
              ]}
            >
                <Upload
                accept=".png,.jpg,.jpeg,.pdf"
                multiple
                beforeUpload={(file) => {
                  // validate file type
                  const isPng = file.type === "image/png";
                  const isJpeg =
                    file.type === "image/jpeg" ||
                    file.type === "image/jpg" ||
                    /\.jpe?g$/i.test(file.name);
                  const isPdf = file.type === "application/pdf";
                  if (!isPng && !isJpeg && !isPdf) {
                    message.error(`${file.name} must be PNG, JPG/JPEG or PDF.`);
                    return Upload.LIST_IGNORE;
                  }
                  // prevent auto upload
                  return false;
                }}
                fileList={uuidFiles}
                onRemove={(file) => {
                  const newList = uuidFiles.filter((f) => f.uid !== file.uid);
                  setUuidFiles(newList);
                  // trigger form validation update
                  form.setFieldsValue({ UUID: newList });
                  form.validateFields(["UUID"]).catch(() => {});
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
                    const isPpdf = t === "application/pdf";
                    return isP || isJ || isPpdf;
                  });
                  if (list.length > 2) list = list.slice(list.length - 2);
                  setUuidFiles(list);
                  form.setFieldsValue({ UUID: list });
                  form.validateFields(["UUID"]).catch(() => {});
                }}
              >
                <Button icon={<UploadOutlined />}>Upload ID Documents</Button>
              </Upload>
            </Form.Item>

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
                <Link
                  to="/terms"
                  className="register-terms-link"
                  target="_blank"
                >
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
              >
                {isLoading ? "Creating account..." : "Join Co-ownership Community"}
              </Button>
            </Form.Item>

            <div className="register-login-link">
              Already a co-owner? <Link to="/login">Sign in</Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
