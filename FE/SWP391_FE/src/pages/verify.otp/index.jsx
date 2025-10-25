import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { MailOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./verify-otp.css";

const VerifyOTP = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state or localStorage (fallback)
    const emailFromState = location.state?.email; // là biến email của navigate("/verify-otp", { state: { email: values.email } }); bên file register ( index.jsx )
    const emailFromStorage = localStorage.getItem("email"); // là biến values.email bên file register ( index.jsx ) đã lưu vào
    const emailToUse = emailFromState || emailFromStorage; // trường hợp check xem chỉ cần tồn tại 1 trong 2 cái là được

    if (emailToUse) {
      setEmail(emailToUse); //setEmail của useState hiện tại thành email vừa lấy được
      form.setFieldsValue({ email: emailToUse }); //set giá trị bên trong cái ô nhập thành email này luôn
    }
  }, [location.state, form]); // hệ thống sẽ tự động chạy useEffect này khi location.state ( tức là cái giá trị email bên register khi navigate qua đây thay đổi, thì web bên này cũng thay đổi theo ) hoặc giá trị trong form khi có sự thay thay đổi

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const requestData = {
        email: localStorage.getItem("email"),
        otp: values.otp,
      };

      console.log("Verifying OTP with data:", requestData);

      message.loading("Verifying OTP...", 0);

      const response = await api.post("/auth/verify-account", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();
      toast.success("Account verified successfully!");
      toast.success("Your account is now activated! You can now sign in.");

      // Clear email from localStorage
      localStorage.removeItem("email");

      // Navigate to login page
      navigate("/login");

      console.log("Verification response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Verification error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "OTP verification failed. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Invalid OTP. Please check and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please register again.";
      } else if (error.response?.status === 410) {
        errorMessage =
          error.response.data?.message ||
          "OTP has expired. Please request a new one.";
      } else if (error.response?.status === 500) {
        errorMessage =
          error.response.data?.message ||
          "Server error. Please try again later.";
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

  const resendOTP = async () => {
    try {
      message.loading("Resending OTP...", 0);

      await api.post(
        "/auth/resend-otp",
        { email: email },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      message.destroy();
      toast.success("OTP has been resent to your email!");

      // Bắt đầu countdown 60s
      startCountdown();
    } catch (error) {
      message.destroy();
      console.error("Resend OTP error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Failed to resend OTP. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid email address.";
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please register first.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "Too many requests. Please wait before requesting another OTP.";
      } else if (error.response?.status === 500) {
        errorMessage =
          error.response.data?.message ||
          "Server error. Please try again later.";
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-content">
        <div className="verify-container">
          {/* Background */}
          <div className="verify-background"></div>

          <div className="verify-card-container">
            <Card className="verify-card">
              <div className="verify-header">
                <h2 className="verify-title">Verify Your Account</h2>
                <p className="verify-subtitle">
                  Please enter the OTP sent to your email address to change
                  password.
                  <br />
                  <MailOutlined />{" "}
                  <strong>{localStorage.getItem("email")}</strong>
                </p>
                <p>Your email is: {localStorage.getItem("email")}</p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                className="verify-form"
              >
                {/* OTP */}
                <Form.Item
                  label="Verification Code"
                  name="otp"
                  rules={[
                    { required: true, message: "OTP is required" },
                    { min: 6, message: "OTP must be at least 6 characters" },
                    { max: 6, message: "OTP must be exactly 6 characters" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "OTP must contain only numbers",
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter 6-digit OTP"
                    type="text"
                    prefix={<SafetyOutlined />}
                    allowClear
                    maxLength={6}
                  />
                </Form.Item>

                {/* Resend OTP Link */}
                <div className="resend-otp-container">
                  <p>
                    Didn't receive the code?{" "}
                    <Button
                      type="link"
                      onClick={resendOTP}
                      disabled={isResendDisabled}
                      className="resend-otp-link"
                    >
                      {isResendDisabled
                        ? `Resend OTP (${countdown}s)`
                        : hasRequestedResend
                        ? "Resend OTP"
                        : "Resend OTP"}
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
                    {isLoading ? "Verifying..." : "Verify Account"}
                  </Button>
                </Form.Item>

                <div className="verify-login-link">
                  Already verified? <Link to="/login">Sign in</Link>
                </div>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
