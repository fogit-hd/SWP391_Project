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

      message.loading("Đang đổi mật khẩu...", 0);

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
      toast.success("Đổi mật khẩu thành công!");

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
              <h2 className="change-password-title">Đổi mật khẩu của bạn</h2>
              <p className="change-password-subtitle">
                Bảo mật tài khoản của bạn bằng mật khẩu mới
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
                  label="Mật khẩu cũ"
                  name="oldPassword"
                  rules={[
                    { required: true, message: "Mật khẩu là bắt buộc" },
                    {
                      min: 8,
                      message: "Mật khẩu phải có ít nhất 8 ký tự",
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu cũ của bạn"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>

                {/* New Password */}
                <Form.Item
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Mật khẩu là bắt buộc" },
                    {
                      min: 8,
                      message: "Mật khẩu phải có ít nhất 8 ký tự",
                    },
                    {
                      validator: (_, value) => {
                        if (value && value === savedPassword) {
                          return Promise.reject(
                            new Error(
                              "Mật khẩu mới phải khác với mật khẩu cũ"
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
                    placeholder="Tạo mật khẩu (tối thiểu 8 ký tự)"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>

                {/* Confirm Password */}
                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={["newPassword"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Mật khẩu không khớp")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Xác nhận mật khẩu của bạn"
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
                    {isLoading ? "Đang đổi..." : "Đổi mật khẩu"}
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div className="change-password-footer">
              <Link to="/" className="change-password-back-link">
                <ArrowLeftOutlined /> Về trang chủ
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
