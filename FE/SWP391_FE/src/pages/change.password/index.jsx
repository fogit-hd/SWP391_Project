import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Row, Col } from "antd";
import { LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [savedPassword, setSavedPassword] = useState(null);
  const navigate = useNavigate();

  // Lấy password đã lưu từ localStorage khi component mount
  useEffect(() => {
    const passwordFromStorage = localStorage.getItem("password");
    if (passwordFromStorage) {
      setSavedPassword(passwordFromStorage);
      console.log("Password loaded from localStorage");
    } else {
      console.log("No password found in localStorage");
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const requestData = {
        oldPassword: values["oldPassword"],
        newPassword: values["newPassword"],
      };

      console.log("Changing password with data:", requestData);

      message.loading("Changing password...", 0);

      // Thử với PUT method trước, nếu không được thì thử POST
      let response;
      try {
        response = await api.put("/settings/change-password", requestData, {
          headers: { "Content-Type": "application/json" },
        });
      } catch (putError) {
        if (putError.response?.status === 405) {
          console.log("PUT method not allowed, trying POST...");
          response = await api.put("/settings/change-password", requestData, {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          throw putError;
        }
      }

      message.destroy();
      toast.success("Password changed successfully!");

      // Cập nhật password mới vào localStorage
      localStorage.setItem("password", values.newPassword);
      setSavedPassword(values.newPassword);

      navigate("/");

      console.log("Password change response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Change password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* Background */}
      <div className="verify-background"></div>

      <div className="verify-card-container">
        <Card className="verify-card">
          <div className="verify-header">
            <h2 className="verify-title">Change Your Password</h2>
            <p className="verify-subtitle">
              Please enter your current password and create a new password
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
              {/* Old Password */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="Old Password"
                  name="oldPassword"
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
                    placeholder="Enter your old password"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>
              {/* New Password */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="New Password"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Password is required" },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                    {
                      validator: (_, value) => {
                        if (value && value === savedPassword) {
                          return Promise.reject(
                            new Error(
                              "New password must be different from old password"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
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
              <Col xs={24} md={24}>
                <Form.Item
                  label="Confirm Password"
                  name="confirmPassword"
                  dependencies={["newPassword"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
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
                  {isLoading ? "Changing..." : "Change your Password"}
                </Button>
              </Form.Item>

              <div className="verify-login-link">
                <Link to="/">Back</Link>
              </div>
            </Form>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
