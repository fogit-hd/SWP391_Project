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
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const navigate = useNavigate();

  // Load available vehicles on component mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await api.get("/Vehicle/get-all-vehicle");
      if (response.data && response.data.data) {
        setVehicles(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const userData = localStorage.getItem("userData");
      let createdBy = "";

      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log("Getting user ID from login data:", parsedUserData);

          // The userId should be in the data field from login response
          // Based on database structure, id is the first column (UUID)
          if (parsedUserData.data && parsedUserData.data.id) {
            createdBy = parsedUserData.data.id;
            console.log("Found user ID from userData.data.id:", createdBy);
          } else if (parsedUserData.id) {
            createdBy = parsedUserData.id;
            console.log("Found user ID from userData.id:", createdBy);
          } else {
            console.error("No user ID found in userData structure");
            console.log(
              "Available fields in userData:",
              Object.keys(parsedUserData)
            );
            if (parsedUserData.data) {
              console.log(
                "Available fields in userData.data:",
                Object.keys(parsedUserData.data)
              );
            }
          }
        } catch (e) {
          console.error("Error parsing userData:", e);
        }
      }

      if (!createdBy) {
        message.error("Unable to identify current user. Please login again.");
        setIsLoading(false);
        return;
      }

      console.log("Using user ID for CreatedBy:", createdBy);

      // Prepare API request parameters
      const requestParams = {
        Name: values.name,
        CreatedBy: createdBy,
        GovernancePolicy:
          values.governancePolicy || "Default governance policy",
        VehicleId: values.vehicleId || "", // Optional field
      };

      console.log("Creating group with parameters:", requestParams);

      message.loading("Creating group...", 0);

      // Make API call with query parameters
      const response = await api.post("/CoOwnership/create", null, {
        params: requestParams,
        headers: { "Content-Type": "application/json" },
      });

      message.destroy();

      if (response.status === 200 || response.status === 201) {
        toast.success("Group created successfully!");
        console.log("Group created successfully:", response.data);

        // Navigate back to home or groups page
        navigate("/");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      message.destroy();
      console.error("Create group error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);

      let errorMessage = "Failed to create group. Please try again.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Invalid request data. Please check your input.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login again.";
        navigate("/login");
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create groups.";
      } else if (error.response?.status === 404) {
        errorMessage = "Vehicle not found. Please select a valid vehicle.";
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

              {/* Vehicle Selection */}
              <Col xs={24} md={24}>
                <Form.Item
                  label="Vehicle (Optional)"
                  name="vehicleId"
                  rules={
                    [
                      // No required validation since it's optional
                    ]
                  }
                  hasFeedback
                >
                  <Select
                    placeholder="Select a vehicle (optional)"
                    prefix={<CarOutlined />}
                    allowClear
                    loading={loadingVehicles}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {vehicles.map((vehicle) => (
                      <Option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make || "Unknown"} {vehicle.model || "Model"} -{" "}
                        {vehicle.plateNumber || "No Plate"}
                      </Option>
                    ))}
                  </Select>
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
                <Link to="/">Back to Home</Link>
              </div>
            </Form>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroup;
