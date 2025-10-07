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
// If using AntD v5, remember to import base reset once in your app root:
// import "antd/dist/reset.css";
import { useDispatch } from "react-redux";
import { login } from "../../redux/accountSlice";
<<<<<<< HEAD
import "./login.css";

const LoginPage = () => {
=======

const EVCoShipLoginPage = () => {
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
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
      toast.success("Successfully create new account!");
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
<<<<<<< HEAD
    <div className="login-container">
      {/* Background */}
      <div className="login-background"></div>

      <div className="login-card-container">
        <Card className="login-card">
          <div className="login-header">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account</p>
=======
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ rememberMe: false }}
            onFinish={onFinish}
            requiredMark={false}
<<<<<<< HEAD
            className="login-form"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                placeholder="Enter your username"
=======
          >
            <Form.Item
              label="Phone"
              name="phone"
              rules={[{ required: true, message: "Phone is required" }]}
            >
              <Input
                placeholder="Enter your email"
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
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

<<<<<<< HEAD
            <Row
              justify="space-between"
              align="middle"
              className="login-remember-row"
            >
=======
            <Row justify="space-between" align="middle">
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
              <Col>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
<<<<<<< HEAD
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="login-forgot-link"
                >
=======
                <a href="#" onClick={(e) => e.preventDefault()}>
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
                  Forgot your password?
                </a>
              </Col>
            </Row>

<<<<<<< HEAD
            <Form.Item>
=======
            <Form.Item style={{ marginTop: 8 }}>
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
<<<<<<< HEAD
                className="login-submit-button"
=======
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Form.Item>

<<<<<<< HEAD
            <Divider className="login-divider">Or continue with</Divider>

            <div className="login-social-buttons">
=======
            <Divider>Or continue with</Divider>

            <div className="grid grid-cols-2 gap-3">
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
              <Button
                type="default"
                block
                icon={<FaGoogle />}
                onClick={() => message.info("Google OAuth not implemented")}
<<<<<<< HEAD
                className="login-social-button"
              >
                Google
              </Button>
=======
              >
                Google
              </Button>
              <Button
                type="default"
                block
                icon={<FaGithub />}
                onClick={() => message.info("GitHub OAuth not implemented")}
              >
                GitHub
              </Button>
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default LoginPage;
=======
export default EVCoShipLoginPage;
>>>>>>> e93a1741e41d6db3f7d085d06f371f107bfc88b7
