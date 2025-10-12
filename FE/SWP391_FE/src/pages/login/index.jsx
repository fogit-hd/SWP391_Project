import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Checkbox,
  Button,
  Card,
  Divider,
  Row,
  Col,
  message,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/accountSlice";
import "./login.css";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
    1. Cập nhật => dispatch
    2. Get => selector
  */

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      form.setFieldsValue({
        email: rememberedEmail,
        rememberMe: true,
      });
    }
  }, [form]);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      toast.success("Successfully logged in!");
      console.log(response);

      // Extract tokens from response.data.data (nested structure)
      const { accessToken, refreshToken, role } =
        response.data.data || response.data;

      // Store tokens
      console.log("Setting authentication token");
      console.log("Access token:", accessToken);
      console.log("Refresh token:", refreshToken);
      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Save userData to localStorage for persistence
      console.log("Setting user data");
      
      // Tạo userData với roleId từ role
      const roleMapping = {
        Admin: 1,
        Staff: 2,
        CoOwner: 3,
      };
      const roleId = roleMapping[role] || 3;
      
      const userData = {
        ...response.data,
        roleId: roleId,
        role: role,
      };
      
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Verify tokens were set
      console.log("Verifying authentication tokens");
      console.log("Token in localStorage:", localStorage.getItem("token"));
      console.log("RefreshToken in localStorage:", localStorage.getItem("refreshToken"));

      // Handle Remember me functionality
      if (values.rememberMe) {
        localStorage.setItem("rememberedEmail", values.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // lưu state
      dispatch(login(response.data));

      if (role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (e) {
      console.error("Login error:", e);
      console.error("Error response:", e.response?.data);

      let errorMessage = "Login failed. Please try again.";

      // Check if account is not activated
      if (
        e.response?.status === 403 ||
        e.response?.data?.message?.includes("not activated") ||
        e.response?.data?.message?.includes("inactive")
      ) {
        errorMessage =
          "Your account is not activated yet. Please check your email and verify your account first.";
        toast.error(errorMessage);
      } else if (e.response?.status === 401) {
        errorMessage =
          e.response?.data?.message ||
          "Invalid email or password. Please check your credentials.";
        toast.error(errorMessage);
      } else if (e.response?.status === 404) {
        errorMessage =
          "Email not found. Please check your email or register first.";
        toast.error(errorMessage);
      } else if (e.response?.status === 500) {
        errorMessage =
          e.response?.data?.message || "Server error. Please try again later.";
        toast.error(errorMessage);
      } else {
        errorMessage = e.response?.data?.message || errorMessage;
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = async () => {
    const currentEmail = form.getFieldValue("email");

    // Validate email before navigating
    if (!currentEmail) {
      message.error("Please enter your email address first");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      message.error("Please enter a valid email address");
      return;
    }

    try {
      // Check account status before allowing password reset
      message.loading("Checking account status...", 0);

      const response = await api.post("/auth/check-account-status", {
        email: currentEmail,
      });

      message.destroy();

      // If account is not active, navigate to verify.otp
      if (response.data && response.data.isActive === false) {
        toast.info(
          "Your account is not activated yet. Redirecting to verification page..."
        );
        localStorage.setItem("email", currentEmail);
        navigate("/verify-otp", { state: { email: currentEmail } });
      } else {
        // Account is active, proceed to forgot password
        localStorage.setItem("email", currentEmail);
        navigate("/forgot-password", { state: { email: currentEmail } });
      }
    } catch (error) {
      message.destroy();
      console.error("Account status check error:", error);

      // If the check fails, assume account is not active and redirect to verify.otp
      // This is safer as it prevents password reset for potentially inactive accounts
      toast.warning(
        "Unable to verify account status. Please activate your account first."
      );
      localStorage.setItem("email", currentEmail);
      navigate("/verify-otp", { state: { email: currentEmail } });
    }
  };

  return (
    <div className="login-container">
      {/* Background */}
      <div className="login-background"></div>

      <div className="login-card-container">
        <Card className="login-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back, Co-owner</h2>
            <p className="login-subtitle">
              Sign in to access your shared vehicles
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ rememberMe: false }}
            onFinish={onFinish}
            requiredMark={false}
            className="login-form"
          >
            {/* Email Field */}
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Email is required" }]}
            >
              <Input
                placeholder="Enter your email"
                prefix={<MailOutlined />}
                allowClear
              />
            </Form.Item>
            {/* Password Field */}
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Enter password"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Row
              justify="space-between"
              align="middle"
              className="login-remember-row"
            >
              <Col>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <a
                  onClick={handleForgotPassword}
                  className="login-forgot-link"
                  style={{ cursor: "pointer" }}
                >
                  Forgot Password?
                </a>
              </Col>
            </Row>

            <Row justify="center" align="middle" style={{ marginTop: "10px" }}>
              <Col>
                <Link to="/register" className="login-register-link">
                  Don't have an account? Register here
                </Link>
              </Col>
            </Row>

            <Row justify="center" align="middle" style={{ marginTop: "10px" }}>
              <Col>
                <Link to="/verify-otp" className="login-verify-link">
                  Need to verify your account? Click here
                </Link>
              </Col>
            </Row>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                className="login-submit-button"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
