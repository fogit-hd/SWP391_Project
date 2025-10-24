import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, message, Row, Col, Select } from "antd";
import {
  TeamOutlined,
  FileTextOutlined,
  CarOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./create-group.css";
import AppHeader from "../../components/reuse/AppHeader";
import AppFooter from "../../components/reuse/AppFooter";

const { TextArea } = Input;

const CreateGroup = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      // Kiểm tra tên nhóm đã tồn tại chưa
      const groupsRes = await api.get("/CoOwnership/my-groups");
      let groupList = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.data || []);
      const exists = groupList.some(g => g.name?.trim().toLowerCase() === values.name.trim().toLowerCase());
      if (exists) {
        toast.error("Group name already exists. Please choose another name.");
        setIsLoading(false);
        return;
      }
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
    <>
      <AppHeader />
      <div className="create-group-container" style={{ minHeight: "calc(100vh - 64px - 200px)" }}>
        <div className="create-group-card-wrapper">
          <Card className="create-group-card" bordered={false}>
            <div className="create-group-header">
              <TeamOutlined className="create-group-header-icon" />
              <h2 className="create-group-title">Create New Group</h2>
              <p className="create-group-subtitle">
                Start a new co-ownership group to manage shared resources and vehicles
              </p>
            </div>

          <div className="create-group-body">
            <div className="create-group-info-box">
              <h4><InfoCircleOutlined /> What is a Co-ownership Group?</h4>
              <p>A group allows multiple members to share ownership and usage of electric vehicles, reducing costs and promoting sustainable transportation.</p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="create-group-form"
            >
              {/* Group Name */}
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
                  placeholder="Enter group name (e.g., Downtown EV Sharers)"
                  prefix={<TeamOutlined />}
                  allowClear
                />
              </Form.Item>

              {/* Governance Policy */}
              <Form.Item
                label="Governance Policy (Optional)"
                name="governancePolicy"
                rules={[
                  {
                    max: 1000,
                    message: "Governance policy must be less than 1000 characters",
                  },
                ]}
                hasFeedback
              >
                <TextArea
                  placeholder="Describe the governance policy for this group (optional)"
                  rows={4}
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              <div className="create-group-form-actions">
                <Button
                  type="default"
                  size="large"
                  className="create-group-cancel-btn"
                  onClick={() => navigate("/view-myGroup")}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  size="large"
                  className="create-group-submit-btn"
                  icon={<PlusOutlined />}
                >
                  {isLoading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </Form>
          </div>

          <div className="create-group-footer">
            <Link to="/view-myGroup" className="create-group-back-link">
              <ArrowLeftOutlined /> Back to My Groups
            </Link>
          </div>
        </Card>
      </div>
      </div>
      <AppFooter />
    </>
  );
};

export default CreateGroup;
