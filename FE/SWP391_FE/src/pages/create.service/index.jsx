import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Row,
  Col,
  Select,
  Spin,
  Space,
  Divider,
} from "antd";
import {
  TeamOutlined,
  CarOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/hooks/useAuth";

const { TextArea } = Input;

const CreateServiceRequest = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingServiceCenters, setLoadingServiceCenters] = useState(false);

  const navigate = useNavigate();
  const { isCoOwner, isAuthenticated } = useAuth();

  // Role check
  useEffect(() => {
    console.log("[CREATE-SERVICE] Role check:", {
      isAuthenticated,
      isCoOwner,
    });

    if (!isAuthenticated) {
      console.log(
        "[CREATE-SERVICE] ✗ Not authenticated - redirecting to login"
      );
      navigate("/login");
      return;
    }

    if (!isCoOwner) {
      console.log("[CREATE-SERVICE] ✗ Not CoOwner role - redirecting to home");
      navigate("/");
      return;
    }

    console.log("[CREATE-SERVICE] ✓ CoOwner access granted");
  }, [isAuthenticated, isCoOwner, navigate]);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
    fetchServiceCenters();
  }, []);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      console.log("[CREATE-SERVICE] Fetching my groups...");
      const response = await api.get("/CoOwnership/my-groups");
      console.log("[CREATE-SERVICE] Groups response:", response.data);

      let groupList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setGroups(groupList);
      console.log("[CREATE-SERVICE] ✓ Loaded", groupList.length, "groups");
    } catch (error) {
      console.error("[CREATE-SERVICE] Error fetching groups:", error);
      message.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchServiceCenters = async () => {
    setLoadingServiceCenters(true);
    try {
      console.log("[CREATE-SERVICE] Fetching service centers...");
      const response = await api.get("/service-centers");
      console.log("[CREATE-SERVICE] Service centers response:", response.data);

      let centerList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setServiceCenters(centerList);
      console.log(
        "[CREATE-SERVICE] ✓ Loaded",
        centerList.length,
        "service centers"
      );
    } catch (error) {
      console.error("[CREATE-SERVICE] Error fetching service centers:", error);
      message.error("Failed to load service centers");
    } finally {
      setLoadingServiceCenters(false);
    }
  };

  const handleGroupChange = async (groupId) => {
    console.log("[CREATE-SERVICE] Group selected:", groupId);
    setSelectedGroup(groupId);
    form.setFieldValue("vehicleId", undefined);
    setVehicles([]);

    if (!groupId) {
      setSelectedGroupData(null);
      return;
    }

    // Fetch group details
    setLoadingVehicles(true);
    try {
      console.log("[CREATE-SERVICE] Fetching group details...");
      const groupResponse = await api.get(
        `/CoOwnership/get-group-by-id?groupId=${groupId}`
      );
      console.log("[CREATE-SERVICE] Group details:", groupResponse.data);
      setSelectedGroupData(groupResponse.data);

      // Fetch vehicles for this group
      console.log("[CREATE-SERVICE] Fetching vehicles for group:", groupId);
      const vehiclesResponse = await api.get(
        `/CoOwnership/${groupId}/vehicles`
      );
      console.log("[CREATE-SERVICE] Vehicles response:", vehiclesResponse.data);

      let vehicleList = Array.isArray(vehiclesResponse.data)
        ? vehiclesResponse.data
        : vehiclesResponse.data?.data || [];

      setVehicles(vehicleList);
      console.log("[CREATE-SERVICE] ✓ Loaded", vehicleList.length, "vehicles");
    } catch (error) {
      console.error(
        "[CREATE-SERVICE] Error fetching group or vehicles:",
        error
      );
      message.error("Failed to load group details or vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const onFinish = async (values) => {
    console.log("[CREATE-SERVICE] Form submitted with values:", values);
    setIsLoading(true);

    try {
      // Validate and sanitize payload
      const payload = {
        groupId: values.groupId?.toString().trim() || null,
        vehicleId: values.vehicleId?.toString().trim() || null,
        serviceCenterId: values.serviceCenterId?.toString().trim() || null,
        type: values.type?.toString().trim().toUpperCase() || null,
        title: values.title?.toString().trim() || null,
        description: values.description?.toString().trim() || null,
      };

      // Validation checks
      const missingFields = Object.entries(payload)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error("[CREATE-SERVICE] ✗ Missing required fields:", missingFields);
        toast.error(`Missing required fields: ${missingFields.join(", ")}`);
        setIsLoading(false);
        return;
      }

      // Validate field formats
      const validation = {
        groupId: /^[a-f0-9\-]{36}$/i.test(payload.groupId),
        vehicleId: /^[a-f0-9\-]{36}$/i.test(payload.vehicleId),
        serviceCenterId: /^[a-f0-9\-]{36}$/i.test(payload.serviceCenterId),
        type: /^(MAINTENANCE|REPAIR|INSPECTION|CLEANING|UPGRADE)$/.test(payload.type),
        title: payload.title.length >= 5 && payload.title.length <= 200,
        description: payload.description.length >= 10 && payload.description.length <= 1000,
      };

      const failedValidation = Object.entries(validation)
        .filter(([key, isValid]) => !isValid)
        .map(([key]) => key);

      if (failedValidation.length > 0) {
        console.error("[CREATE-SERVICE] ✗ Validation failed for:", failedValidation);
        toast.error(`Invalid format for: ${failedValidation.join(", ")}`);
        setIsLoading(false);
        return;
      }

      console.log("[CREATE-SERVICE] ✓ Payload validation passed");
      console.log("[CREATE-SERVICE] Sending payload:", JSON.stringify(payload, null, 2));
      console.log("[CREATE-SERVICE] API endpoint: /service-requests");

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key]);
      });

      console.log("[CREATE-SERVICE] FormData prepared for multipart/form-data");

      const hide = message.loading("Creating service request...", 0);
      const response = await api.post("/service-requests", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      hide();

      console.log("[CREATE-SERVICE] ✓ Service request created:", response.data);

      if (response.status === 200 || response.status === 201) {
        console.log("[CREATE-SERVICE] ✓ Response status:", response.status);
        console.log("[CREATE-SERVICE] Service request details:", {
          id: response.data?.data?.id || response.data?.id,
          title: response.data?.data?.title || response.data?.title,
          type: response.data?.data?.type || response.data?.type,
          status: response.data?.data?.status || response.data?.status,
          serviceCenterName: response.data?.data?.serviceCenterName || response.data?.serviceCenterName,
          createdAt: response.data?.data?.createdAt || response.data?.createdAt,
        });
        toast.success("Service request created successfully");
        navigate("/");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      message.destroy();
      console.error("[CREATE-SERVICE] ✗ Error creating service request:", error);
      console.error("[CREATE-SERVICE] Error response data:", error.response?.data);
      console.error("[CREATE-SERVICE] Error response status:", error.response?.status);
      console.error("[CREATE-SERVICE] Error message:", error.message);

      let errorMessage = "Failed to create service request. Please try again.";

      if (error.response?.status === 400) {
        // Backend validation error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error ||
                      "Invalid request data. Check console for details.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login again.";
        navigate("/login");
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create service requests.";
      } else if (error.response?.status === 422) {
        // Unprocessable Entity - validation error
        errorMessage = error.response.data?.message || 
                      "Validation error. Check that all fields are valid.";
      } else if (error.response?.status === 500) {
        errorMessage = error.response.data?.message || 
                      "Server error. Check backend logs.";
      } else {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCoOwner) {
    return null;
  }

  return (
    <>
      <div
        className="create-group-container"
        style={{ minHeight: "calc(100vh - 64px - 200px)" }}
      >
        <div className="create-group-card-wrapper">
          <Card className="create-group-card" bordered={false}>
            <div className="create-group-header">
              <PlusOutlined className="create-group-header-icon" />
              <h2 className="create-group-title">Create Service Request</h2>
              <p className="create-group-subtitle">
                Request maintenance or service for your group's vehicles
              </p>
            </div>

            <div className="create-group-body">
              <div className="create-group-info-box">
                <h4>
                  <InfoCircleOutlined /> What is a Service Request?
                </h4>
                <p>
                  Submit a service request to get professional maintenance and
                  support for your shared vehicles. Our technicians will handle
                  repairs, maintenance, and inspections.
                </p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                className="create-group-form"
              >
                {/* Group Selection */}
                <Form.Item
                  label="Select Group"
                  name="groupId"
                  rules={[{ required: true, message: "Group is required" }]}
                  hasFeedback
                >
                  <Select
                    placeholder="Select a group"
                    loading={loadingGroups}
                    onChange={handleGroupChange}
                    prefix={<TeamOutlined />}
                  >
                    {groups.map((group) => (
                      <Select.Option key={group.id} value={group.id}>
                        {group.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Vehicle Selection */}
                {selectedGroup && (
                  <Form.Item
                    label="Select Vehicle"
                    name="vehicleId"
                    rules={[{ required: true, message: "Vehicle is required" }]}
                    hasFeedback
                  >
                    <Select
                      placeholder="Select a vehicle"
                      loading={loadingVehicles}
                      prefix={<CarOutlined />}
                    >
                      {vehicles.map((vehicle) => (
                        <Select.Option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.plateNumber}
                          )
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {/* Service Center Selection */}
                <Form.Item
                  label="Select Service Center"
                  name="serviceCenterId"
                  rules={[
                    { required: true, message: "Service center is required" },
                  ]}
                  hasFeedback
                >
                  <Select
                    placeholder="Select a service center"
                    loading={loadingServiceCenters}
                    prefix={<EnvironmentOutlined />}
                  >
                    {serviceCenters.map((center) => (
                      <Select.Option key={center.id} value={center.id}>
                        {center.name} - {center.address}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Divider />

                {/* Service Type */}
                <Form.Item
                  label="Service Type"
                  name="type"
                  rules={[
                    { required: true, message: "Service type is required" },
                  ]}
                  hasFeedback
                >
                  <Select placeholder="Select service type">
                    <Select.Option value="MAINTENANCE">
                      Maintenance
                    </Select.Option>
                    <Select.Option value="REPAIR">Repair</Select.Option>
                    <Select.Option value="INSPECTION">Inspection</Select.Option>
                    <Select.Option value="CLEANING">Cleaning</Select.Option>
                    <Select.Option value="UPGRADE">Upgrade</Select.Option>
                  </Select>
                </Form.Item>

                {/* Title */}
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[
                    { required: true, message: "Title is required" },
                    {
                      min: 5,
                      message: "Title must be at least 5 characters",
                    },
                    {
                      max: 200,
                      message: "Title must be less than 200 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <Input
                    placeholder="Brief description of the service needed"
                    maxLength={200}
                    showCount
                  />
                </Form.Item>

                {/* Description */}
                <Form.Item
                  label="Description"
                  name="description"
                  rules={[
                    { required: true, message: "Description is required" },
                    {
                      min: 10,
                      message: "Description must be at least 10 characters",
                    },
                    {
                      max: 1000,
                      message: "Description must be less than 1000 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <TextArea
                    placeholder="Detailed description of the issue and what needs to be done"
                    rows={5}
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>

                <div className="create-group-form-actions">
                  <Button
                    type="default"
                    size="large"
                    className="create-group-cancel-btn"
                    onClick={() => navigate("/")}
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
                    {isLoading ? "Creating..." : "Create Service Request"}
                  </Button>
                </div>
              </Form>
            </div>

            <div className="create-group-footer">
              <Link to="/" className="create-group-back-link">
                <ArrowLeftOutlined /> Back to Home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreateServiceRequest;
