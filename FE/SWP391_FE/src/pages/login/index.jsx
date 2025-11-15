import React, { useState, useEffect } from "react";
import { Checkbox, Button, Card, Row, Col, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../components/redux/accountSlice";
import "./login.css";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Email không hợp lệ").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  rememberMe: Yup.boolean(),
});

const getInitialValues = () => {
  const rememberedEmail = localStorage.getItem("rememberedEmail");
  return {
    email: rememberedEmail || "",
    password: "",

    rememberMe: false,
  };
};

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("password");
    sessionStorage.clear();
  }, []);

  const onSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      console.log("\n[LOGIN] === LOGIN PROCESS START ===");
      console.log("[LOGIN] User input:", {
        email: values.email,
        rememberMe: values.rememberMe,
      });

      const response = await api.post("/auth/login", values);
      toast.success("Successfully logged in!");

      console.log("[LOGIN] API Response received");
      console.log("[LOGIN] Full API response:", response);
      console.log("[LOGIN] response.data:", response.data);
      console.log("[LOGIN] response.data.data:", response.data.data);

      // Extract tokens from response.data.data (nested structure)
      const { accessToken, refreshToken } = response.data.data || response.data;

      console.log("[LOGIN] Tokens extracted:", {
        accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null,
        refreshToken: refreshToken
          ? refreshToken.substring(0, 20) + "..."
          : null,
      });

      // Store tokens
      console.log("[LOGIN] Storing tokens in localStorage");
      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      console.log("[LOGIN] Decoding JWT token");

      // Decode JWT to get role
      const { decodeJWT } = await import("../../components/utils/jwt");
      const decodedToken = decodeJWT(accessToken);
      console.log("[LOGIN] Decoded JWT:", decodedToken);

      const role = decodedToken?.role;
      console.log(
        "[LOGIN] Raw role from JWT:",
        role,
        "(type:",
        typeof role,
        ")"
      );

      const roleMapping = {
        Admin: 1,
        Staff: 2,
        CoOwner: 3,
        Technician: 4,
        // Handle numeric roles
        1: 1,
        2: 2,
        3: 3,
        4: 4,
      };

      const roleId = roleMapping[role];
      console.log("[LOGIN] Role mapping result:", {
        rawRole: role,
        mappedRoleId: roleId,
        mappingFound: !!roleId,
      });

      if (!roleId) {
        console.error("[LOGIN] ✗ Unknown role from server:", role);
        toast.error(`Unknown role: ${role}. Please contact administrator.`);
        return;
      }

      const userData = {
        ...response.data,
        roleId: roleId,
        role: role,
      };

      console.log("[LOGIN] Storing userData in localStorage");
      localStorage.setItem("userData", JSON.stringify(userData));

      // Verify tokens were set
      console.log("[LOGIN] Verifying tokens stored in localStorage");
      console.log(
        "[LOGIN] Token in localStorage:",
        localStorage.getItem("token") ? "✓ Exists" : "✗ Missing"
      );
      console.log(
        "[LOGIN] RefreshToken in localStorage:",
        localStorage.getItem("refreshToken") ? "✓ Exists" : "✗ Missing"
      );

      //Handle password for change password
      localStorage.setItem("password", values.password);
      console.log("[LOGIN] Password stored for change password feature");

      // Handle Remember me functionality
      if (values.rememberMe) {
        localStorage.setItem("rememberedEmail", values.email);
        console.log("[LOGIN] Email remembered");
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      console.log("[LOGIN] Dispatching login action to Redux");
      // lưu state
      dispatch(login(userData));

      console.log("[LOGIN] ✓ Role check - roleId:", roleId);

      // Navigate based on role
      if (roleId === 1) {
        console.log("[LOGIN] ✓ Admin login");
        navigate("/admin/dashboard");
      } else if (roleId === 2) {
        console.log("[LOGIN] ✓ Staff login");
        navigate("/staff/dashboard");
      } else if (roleId === 3) {
        console.log("[LOGIN] ✓ CoOwner login");
        navigate("/");
      } else if (roleId === 4) {
        console.log("[LOGIN] ✓ Technician login");
        navigate("/technician/dashboard");
      } else {
        console.warn("[LOGIN] ⚠ Unknown roleId");
        navigate("/");
      }

      console.log("[LOGIN] === LOGIN PROCESS END (SUCCESS) ===\n");
    } catch (e) {
      console.error("[LOGIN] === LOGIN PROCESS END (ERROR) ===");
      console.error("[LOGIN] Error:", e);
      console.error("[LOGIN] Error response:", e.response?.data);

      let errorMessage = "Login failed. Please try again.";

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
      setSubmitting(false);
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = (currentEmail) => {
    // Validate email before navigating
    if (!currentEmail) {
      message.error("Please enter your email address first");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      message.error("Please enter a valid email address");
      return;
    }

    localStorage.setItem("email", currentEmail);
    navigate("/forgot-password", { state: { email: currentEmail } });
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>

      <div className="login-card-container">
        <Card className="login-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back, Co-owner</h2>
            <p className="login-subtitle">
              Please enter your credentials to continue
            </p>
          </div>

          <Formik
            initialValues={getInitialValues()}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => {
              return (
                <Form className="login-form">
                  {/* Email Field */}
                  <div className="floating-label-form-item">
                    <div
                      className={`floating-label-wrapper ${
                        emailFocused || values.email ? "active" : ""
                      } ${errors.email && touched.email ? "has-error" : ""}`}
                    >
                      <div style={{ position: "relative", width: "100%" }}>
                        <MailOutlined
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#999",
                            fontSize: "1rem",
                            zIndex: 2,
                          }}
                        />
                        <Field
                          type="email"
                          name="email"
                          className="floating-input"
                          style={{
                            paddingLeft: "40px",
                            width: "100%",
                            padding: "20px 12px 8px 40px",
                            fontSize: "1rem",
                            border:
                              errors.email && touched.email
                                ? "2px solid #ff4d4f"
                                : "2px solid #d9d9d9",
                            borderRadius: "8px",
                            transition: "all 0.3s ease",
                            backgroundColor: "#fff",
                            outline: "none",
                          }}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={(e) => {
                            setEmailFocused(false);
                            setEmailValue(e.target.value);
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue("email", value);
                            setEmailValue(value);
                          }}
                        />
                        <label className="floating-label">Email</label>
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        style={{
                          color: "#ff4d4f",
                          fontSize: "14px",
                          marginTop: "4px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="floating-label-form-item">
                    <div
                      className={`floating-label-wrapper ${
                        passwordFocused || values.password ? "active" : ""
                      } ${
                        errors.password && touched.password ? "has-error" : ""
                      }`}
                    >
                      <div style={{ position: "relative", width: "100%" }}>
                        <LockOutlined
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#999",
                            fontSize: "1rem",
                            zIndex: 2,
                          }}
                        />
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className="floating-input"
                          autoComplete="current-password"
                          style={{
                            paddingLeft: "40px",
                            paddingRight: "40px",
                            width: "100%",
                            padding: "20px 40px 8px 40px",
                            fontSize: "1rem",
                            border:
                              errors.password && touched.password
                                ? "2px solid #ff4d4f"
                                : "2px solid #d9d9d9",
                            borderRadius: "8px",
                            transition: "all 0.3s ease",
                            backgroundColor: "#fff",
                            outline: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "textfield",
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={(e) => {
                            setPasswordFocused(false);
                            setPasswordValue(e.target.value);
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue("password", value);
                            setPasswordValue(value);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#999",
                            fontSize: "1rem",
                            zIndex: 2,
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                        <label className="floating-label">Password</label>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        style={{
                          color: "#ff4d4f",
                          fontSize: "14px",
                          marginTop: "4px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <Row
                    justify="space-between"
                    align="middle"
                    className="login-remember-row"
                  >
                    <Col>
                      <Field name="rememberMe">
                        {({ field }) => (
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e) => {
                              setFieldValue("rememberMe", e.target.checked);
                            }}
                          >
                            Remember me
                          </Checkbox>
                        )}
                      </Field>
                    </Col>
                    <Col>
                      <a
                        onClick={() => handleForgotPassword(values.email)}
                        className="login-forgot-link"
                        style={{ cursor: "pointer" }}
                      >
                        Forgot Password?
                      </a>
                    </Col>
                  </Row>

                  {/* Sign In Button */}
                  <div style={{ marginTop: "0.5rem" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading || isSubmitting}
                      block
                      size="large"
                      className="login-submit-button"
                    >
                      {isLoading || isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>

                  {/* Register Link */}
                  <Row
                    justify="center"
                    align="middle"
                    style={{ marginTop: "16px" }}
                  >
                    <Col>
                      <span style={{ color: "#6b7280" }}>
                        Don't have an account?{" "}
                      </span>
                      <Link to="/register" className="login-register-link">
                        Register here
                      </Link>
                    </Col>
                  </Row>

                  {/* Verify OTP Link */}
                  <Row
                    justify="center"
                    align="middle"
                    style={{ marginTop: "12px" }}
                  >
                    <Col>
                      <Link to="/verify-otp" className="login-verify-link">
                        Need to verify your account?
                      </Link>
                    </Col>
                  </Row>

                  {/* Back to Homepage Button */}
                  <Row
                    justify="center"
                    align="middle"
                    style={{ marginTop: "20px" }}
                  >
                    <Col>
                      <Button
                        type="text"
                        onClick={() => navigate("/")}
                        className="login-back-button"
                      >
                        ← Back to Homepage
                      </Button>
                    </Col>
                  </Row>
                </Form>
              );
            }}
          </Formik>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
