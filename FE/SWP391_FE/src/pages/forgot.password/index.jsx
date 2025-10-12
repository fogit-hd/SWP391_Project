import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Col, Row } from "antd";
import { LockOutlined, MailOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate, useLocation } from "react-router-dom";

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasRequestedResend, setHasRequestedResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state or localStorage (fallback)
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
        email: localStorage.getItem("email") || email,
        activationCode: values["activation-code"],
        newPassword: values.password,
      };

      console.log("Changing password with data:", requestData);

      message.loading("Changing password...", 0);

      const response = await api.post("/auth/reset-password", requestData, {
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();
      toast.success("Change password successfully!");

      // Clear email from localStorage
      localStorage.removeItem("email");

      // Navigate to login page
      navigate("/login");
      toast.success("Use your new password to sign in!");

      console.log("Forgotpassword System response:", response.data);
    } catch (error) {
      message.destroy();
      console.error("Change error:", error);

      let errorMessage = "Password reset failed. Please try again.";
      
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Invalid Activation Code. Please check and try again.";
      } else if (error.response?.status === 403 || error.response?.data?.message?.includes("not activated") || error.response?.data?.message?.includes("inactive")) {
        errorMessage = "Your account is not activated yet. Please verify your account first before resetting password.";
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

  const sendActivationCode = async () => {
    // // Nếu chưa từng request send, xóa email và yêu cầu nhập email mới
    // if (!hasRequestedResend) {
    //   setEmail("");
    //   form.setFieldsValue({ email: "" });
    //   setHasRequestedResend(true);
    //   toast.info("Enter your email again to receive Activation Code!");
    //   return;
    // }

    // // Kiểm tra email có được nhập hay không
    // const currentEmail = form.getFieldValue("email");
    // if (!currentEmail) {
    //   toast.error("Email is required to send Activation Code");
    //   return;
    // }

    // const currentEmail = form.getFieldValue("email");

    const currentEmail = localStorage.getItem("email") || email;
    if (!currentEmail) {
      message.error("Email not found. Please enter first");
      return;
    }
    try {
      message.loading("Sending Activation Code...", 0);

      await api.post(
        "/auth/forgot-password",
        { email: currentEmail },
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
      console.error("Send Activation Code error:", error);
      
      let errorMessage = "Failed to send Activation Code. Please try again.";
      
      // Check if account is not activated
      if (error.response?.status === 403 || error.response?.data?.message?.includes("not activated") || error.response?.data?.message?.includes("inactive")) {
        errorMessage = "Your account is not activated yet. Please verify your account first before resetting password.";
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
              Please enter the Activation Code sent to your email address to
              create a new password.
            </p>
            Your Email is: <b>{email}</b>
          </div>
          {/* {console.log("Rendering with email:", email)}
          {console.log(
            "Rendering with localstrorage email:",
            localStorage.getItem("email")
          )} */}

          <Row>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="verify-form"
            >
              {/* Email
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
                  // disabled={!!email && !hasRequestedResend} // Disable if email is pre-filled and haven't requested resend
                />
              </Form.Item> */}

              {/* Password */}
              <Col xs={24} md={24}>
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
              <Col xs={24} md={24}>
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

              {/* Activation Code */}
              <Form.Item
                label="Activation Code"
                name="activation-code"
                rules={[
                  { required: true, message: "Activation Code is required" },
                  {
                    min: 6,
                    message: "Activation Code must be at least 6 characters",
                  },
                  {
                    max: 6,
                    message: "Activation Code must be exactly 6 characters",
                  },
                  {
                    pattern: /^[0-9]+$/,
                    message: "Activation Code must contain only numbers",
                  },
                ]}
              >
                <Input
                  placeholder="Enter 6-digit Activation Code"
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
                    onClick={sendActivationCode}
                    disabled={isResendDisabled}
                    className="send-activation-code-link"
                  >
                    {isResendDisabled
                      ? `Send Activation Code (${countdown}s)`
                      : hasRequestedResend
                      ? "Send Activation Code"
                      : "Send Activation Code"}
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
                  {isLoading ? "Activating..." : "Activate your Account"}
                </Button>
              </Form.Item>

              <div className="verify-login-link">
                <Link to="/login">Back</Link>
              </div>
            </Form>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
