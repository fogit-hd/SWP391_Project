import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Col, Row } from "antd";
import {
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./forgot-password.css";

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem("email");
    const emailToUse = emailFromState || emailFromStorage;

    if (emailToUse) {
      form.setFieldsValue({ email: emailToUse });
    }
  }, [location.state, form]);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const currentEmail =
        localStorage.getItem("email") || location.state?.email || "";
      const requestData = {
        email: currentEmail,
        activationCode: values["activation-code"],
        newPassword: values.password,
      };

      console.log("Changing password with data:", requestData);

      message.loading("Đang đổi mật khẩu...", 0);

      const response = await api.post("/auth/reset-password", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();
      toast.success("Đổi mật khẩu thành công!");

      localStorage.removeItem("email");

      navigate("/login");
      toast.success("Sử dụng mật khẩu mới để đăng nhập!");

      console.log("Forgotpassword System response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Change error:", error);

      let errorMessage = "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Mã kích hoạt không hợp lệ. Vui lòng kiểm tra và thử lại.";
      } else if (
        error.response?.status === 403 ||
        error.response?.data?.message?.includes("not activated") ||
        error.response?.data?.message?.includes("inactive")
      ) {
        errorMessage =
          "Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh tài khoản trước khi đặt lại mật khẩu.";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy email. Vui lòng kiểm tra lại.";
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

  const sendActivationCode = async () => {
    const currentEmail =
      localStorage.getItem("email") || location.state?.email || "";
    if (!currentEmail) {
      message.error("Không tìm thấy email. Vui lòng nhập email trước.");
      return;
    }
    try {
      message.loading("Đang gửi mã kích hoạt...", 0);

      await api.post(
        "/auth/forgot-password",
        { email: currentEmail },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      message.destroy();
      toast.success("Mã kích hoạt đã được gửi lại đến email của bạn!");

      // Bắt đầu countdown 60s
      startCountdown();
    } catch (error) {
      message.destroy();
      console.error("Send Activation Code error:", error);

      let errorMessage = "Gửi mã kích hoạt thất bại. Vui lòng thử lại.";

      // Check if account is not activated
      if (
        error.response?.status === 403 ||
        error.response?.data?.message?.includes("not activated") ||
        error.response?.data?.message?.includes("inactive")
      ) {
        errorMessage =
          "Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh tài khoản trước khi đặt lại mật khẩu.";
        toast.error(errorMessage);
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-content">
        <div className="forgot-password-container">
          <Card className="verify-card">
            <div className="verify-header">
              <h2 className="verify-title">Đặt lại mật khẩu</h2>
              <p className="verify-subtitle">
                Vui lòng nhập mã kích hoạt được gửi đến email của bạn.
                <br />
                <MailOutlined />{" "}
                <strong>{localStorage.getItem("email") || location.state?.email}</strong>
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
                {/* Password */}
                <Col xs={24} md={24}>
                  <Form.Item
                    label="Mật khẩu mới"
                    name="password"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu" },
                      {
                        min: 8,
                        message: "Mật khẩu phải có ít nhất 8 ký tự",
                      },
                    ]}
                    hasFeedback
                  >
                    <Input.Password
                      placeholder="Tạo mật khẩu (tối thiểu 8 ký tự)"
                      prefix={<LockOutlined />}
                    />
                  </Form.Item>
                </Col>

                {/* Confirm Password */}
                <Col xs={24} md={24}>
                  <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={["password"]}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng xác nhận mật khẩu",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
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
                </Col>

                {/* Activation Code */}
                <Form.Item
                  label="Mã kích hoạt"
                  name="activation-code"
                  rules={[
                    { required: true, message: "Vui lòng nhập mã kích hoạt" },
                    {
                      min: 6,
                      message: "Mã kích hoạt phải có ít nhất 6 ký tự",
                    },
                    {
                      max: 6,
                      message: "Mã kích hoạt phải có đúng 6 ký tự",
                    },
                    {
                      pattern: /^[0-9]+$/,
                      message: "Mã kích hoạt chỉ được chứa số",
                    },
                  ]}
                >
                  <Input
                    placeholder="Nhập mã kích hoạt 6 chữ số"
                    type="text"
                    prefix={<SafetyOutlined />}
                    allowClear
                    maxLength={6}
                  />
                </Form.Item>

                {/* Resend Activation Code Link */}
                <div className="send-activation-code-container">
                  <p>
                    Không nhận được mã?{" "}
                    <Button
                      type="link"
                      onClick={sendActivationCode}
                      disabled={isResendDisabled}
                      className="send-activation-code-link"
                    >
                      {isResendDisabled
                        ? `Gửi lại mã (${countdown}s)`
                        : hasRequestedResend
                        ? "Gửi lại mã kích hoạt"
                        : "Gửi lại mã kích hoạt"}
                    </Button>
                  </p>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                    className="verify-submit-button"
                  >
                    {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </Form.Item>

                <div className="verify-login-link">
                  <Link to="/login">Quay lại</Link>
                </div>
              </Form>
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
