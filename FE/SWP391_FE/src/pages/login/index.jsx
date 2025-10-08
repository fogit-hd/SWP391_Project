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
import { FaGoogle, FaGithub } from "react-icons/fa";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
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
      const response = await api.post("/login", values);
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
      message.error("Login failed. Please try again.");
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
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                placeholder="Enter your username"
                prefix={<MailOutlined />}
                allowClear
              />
            </Form.Item>

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
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="login-forgot-link"
                >
                  Forgot your password?
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
                {isLoading ? "Signing in..." : "Access My Vehicles"}
              </Button>
            </Form.Item>

            <Divider className="login-divider">Or continue with</Divider>

            <div className="login-social-buttons">
              <Button
                type="default"
                block
                icon={<FaGoogle />}
                onClick={() => message.info("Google OAuth not implemented")}
                className="login-social-button"
              >
                Google
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
