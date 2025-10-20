import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Row, Col, Select } from "antd";
import {
  TeamOutlined,
  FileTextOutlined,
  CarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const { TextArea } = Input;
const { Option } = Select;

const CreateGroup = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      // Backend expects JSON body with only name; user is inferred from token
      const payload = {
        name: values.name,
      };

      const hide = message.loading("Creating group...", 0);
      const response = await api.post("/CoOwnership/create", payload, {
        headers: { "Content-Type": "application/json" },
      });
      hide();

      if (response.status === 200 || response.status === 201) {
        toast.success("Create group successfully");
        // Optionally, you can read response.data.group for new group info
        navigate("/myGroup");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      message.destroy();
      console.error("Create group error:", error);
      let errorMessage = "Failed to create group. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login again.";
        navigate("/login");
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create groups.";
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* Background */}
      <div className="verify-background"></div>

      <div className="verify-card-container">
        <Card className="verify-card">
          <div className="verify-header">
            <h2 className="verify-title">Create New Group</h2>
            <p className="verify-subtitle">
              Create a new co-ownership group to manage shared resources and
              vehicles
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
              {/* Group Name */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="Group Name"
                  name="name"
                  rules={[
                    { required: true, message: "Group name is required" },
                    {
                      min: 3,
                      message: "Group name must be at least 3 characters",
                    },
                    {
                      max: 100,
                      message: "Group name must be less than 100 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <Input
                    placeholder="Enter group name"
                    prefix={<TeamOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              {/* Governance Policy */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="Governance Policy"
                  name="governancePolicy"
                  rules={[
                    {
                      max: 1000,
                      message:
                        "Governance policy must be less than 1000 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <TextArea
                    placeholder="Describe the governance policy for this group (optional)"
                    rows={4}
                    maxLength={1000}
                    showCount
                    prefix={<FileTextOutlined />}
                  />
                </Form.Item>
              </Col>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  size="large"
                  className="verify-submit-button"
                  icon={<PlusOutlined />}
                >
                  {isLoading ? "Creating Group..." : "Create Group"}
                </Button>
              </Form.Item>

              <div className="verify-login-link">
                <Link to="/view-mygroup">Back to group list</Link>
              </div>
            </Form>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroup;
