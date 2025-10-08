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
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";

const { Option } = Select;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/register", values);
      toast.success("Successfully create new account!");
      navigate("/login");
      console.log(response);
    } catch (e) {
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
            <h2 className="register-title">Create your account</h2>
            <p className="register-subtitle">It only takes a minute.</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              gender: "MALE",
              agree: false,
            }}
            requiredMark={false}
            className="register-form"
          >
            <Row gutter={16} className="register-form-row">
              {/* Full Name */}
              <Col span={24}>
                <Form.Item
                  label="Full name"
                  name="fullName"
                  rules={[
                    { required: true, message: "This field is required" },
                    {
                      validator: (_, v) =>
                        v && v.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("This field cannot be empty")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Full name"
                    prefix={<UserOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Username */}
              <Col span={24}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    { required: true, message: "This field is required" },
                    {
                      validator: (_, v) =>
                        v && v.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("This field cannot be empty")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Full name"
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
                      : Promise.reject(new Error("You must accept the Terms")),
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
                  Terms &amp; Privacy Policy
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
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </Form.Item>

            <div className="register-login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
