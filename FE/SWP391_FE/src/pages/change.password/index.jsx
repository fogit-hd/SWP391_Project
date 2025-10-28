import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Row, Col } from "antd";
import {
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./change-password.css";

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
    <div className="change-password-page">
      <div className="change-password-content">
        <div className="change-password-container">
          <Card className="change-password-card" bordered={false}>
            <div className="change-password-header">
              <LockOutlined className="change-password-icon" />
              <h2 className="change-password-title">Change Your Password</h2>
              <p className="change-password-subtitle">
                Secure your account with a new password
              </p>
            </div>

            <div className="change-password-body">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="change-password-form"
                requiredMark={false}
              >
                {/* Old Password */}
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

                {/* New Password */}
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

                {/* Confirm Password */}
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

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                    className="change-password-submit-btn"
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div className="change-password-footer">
              <Link to="/" className="change-password-back-link">
                <ArrowLeftOutlined /> Back to Home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
