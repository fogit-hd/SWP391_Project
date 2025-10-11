import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { MailOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";

const VerifyOTP = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend, setHasRequestedResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem("email");
    const emailToUse = emailFromState || emailFromStorage;

    if (emailToUse) {
      setEmail(emailToUse);
      form.setFieldsValue({ email: emailToUse });
    }
  }, [location.state, form]);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const requestData = {
        email: values.email,
        otp: values.otp,
      };

      console.log("Verifying OTP with data:", requestData);

      message.loading("Verifying OTP...", 0);

      const response = await api.post("/auth/verify-account", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();
      toast.success("Account verified successfully!");

      // Clear email from localStorage
      localStorage.removeItem("registerEmail");

      // Navigate to login page
      navigate("/login");

      console.log("Verification response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Verification error:", error);

      let errorMessage = "OTP verification failed. Please try again.";
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Invalid OTP. Please check and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please register again.";
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
    // Nếu chưa từng request resend, xóa email và yêu cầu nhập email mới
    if (!hasRequestedResend) {
      setEmail("");
      form.setFieldsValue({ email: "" });
      setHasRequestedResend(true);
      toast.info("Vui lòng nhập email mới để nhận OTP!");
      return;
    }

    // Kiểm tra email có được nhập hay không
    const currentEmail = form.getFieldValue("email");
    if (!currentEmail) {
      toast.error("Email is required to resend OTP");
      return;
    }

    try {
      message.loading("Resending OTP...", 0);

      await api.post(
        "/auth/send-otp",
        { email: currentEmail },
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
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
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
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="verify-form"
          >
            {/* Email */}
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input
                placeholder="Enter your email address"
                type="email"
                prefix={<MailOutlined />}
                allowClear
                disabled={!!email && !hasRequestedResend} // Disable if email is pre-filled and haven't requested resend
              />
            </Form.Item>

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
  );
};

export default VerifyOTP;
