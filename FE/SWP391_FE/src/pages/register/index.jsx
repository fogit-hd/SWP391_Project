import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Card,
  Row,
  Col,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
// If you're on AntD v5, import the base reset once in your app entry:
// import "antd/dist/reset.css";

const { Option } = Select;

const EVCoShipRegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => /^0\d{9,10}$/.test(phone);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/register", values);
      toast.success("Successfully create new account!");
      navigate("/login");
      console.log(response);
    } catch (e) {
      message.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl mx-4">
        <Card
          className="backdrop-blur-sm"
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: 24 }}
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Create your account</h2>
            <p className="text-gray-500">It only takes a minute.</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              gender: "MALE",
              agree: false,
            }}
            requiredMark={false}
          >
            <Row gutter={16}>
              {/* Full Name */}
              <Col span={24}>
                <Form.Item
                  label="Full name"
                  name="fullName"
                  rules={[
                    { required: true, message: "Full name is required" },
                    {
                      validator: (_, v) =>
                        v && v.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Full name cannot be empty")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Full name"
                    prefix={<UserOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Gender */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[
                    { required: true, message: "Please select a gender" },
                  ]}
                >
                  <Select
                    placeholder="Select gender"
                    options={[
                      {
                        label: (
                          <span>
                            <ManOutlined /> Male
                          </span>
                        ),
                        value: "MALE",
                      },
                      {
                        label: (
                          <span>
                            <WomanOutlined /> Female
                          </span>
                        ),
                        value: "FEMALE",
                      },
                      { label: "Other", value: "OTHER" },
                    ]}
                  />
                </Form.Item>
              </Col>

              {/* Phone */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[
                    { required: true, message: "Phone is required" },
                    {
                      validator: (_, v) =>
                        !v || validatePhone(v)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                "Phone must start with 0 and be 10–11 digits"
                              )
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Phone (e.g. 09xxxxxxxx)"
                    prefix={<PhoneOutlined />}
                    inputMode="numeric"
                    maxLength={11}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Email */}
              <Col span={24}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    {
                      validator: (_, v) =>
                        !v || validateEmail(v)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Please enter a valid email")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Email address"
                    type="email"
                    prefix={<MailOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Password */}
              <Col xs={24} md={12}>
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
                    placeholder="Password (min 8 chars)"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>

              {/* Confirm Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm password"
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
                    placeholder="Confirm password"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Terms */}
            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, v) =>
                    v
                      ? Promise.resolve()
                      : Promise.reject(new Error("You must accept the Terms")),
                },
              ]}
            >
              <Checkbox>
                I agree to the{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Terms &amp; Privacy
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </Form.Item>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default EVCoShipRegisterPage;
