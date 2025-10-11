import React, { useState } from "react";
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

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      toast.success("Successfully logged in!");
      console.log(response);
      const { token, role } = response.data;
      localStorage.setItem("token", token);

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
      const errorMessage =
        e.response?.data?.message || "Login failed. Please try again.";
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
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
                  onClick={(e) => e.preventDefault()}
                  className="login-forgot-link"
                >
                  <Link to="/register">
                    Don't have an account? Register here
                  </Link>
                </a>
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
