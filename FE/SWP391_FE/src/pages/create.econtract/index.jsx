import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Divider,
  Form,
  Input,
  Select,
  Button,
  Modal,
  message,
  DatePicker,
  InputNumber,
  Table,
  Space,
  Tag,
} from "antd";
import api from "../../config/axios";
// import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router";
import "./create-econtract.css";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const CreateEContract = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // New states for contract creation
  const [templates, setTemplates] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // Members selected to sign contract
  const [ownershipShares, setOwnershipShares] = useState([]);
  const [contractDuration, setContractDuration] = useState(6); // months

  const location = useLocation();
  const groupIdFromState = location.state?.groupId;
  const groupIdFromQuery = new URLSearchParams(location.search).get("groupId");
  const groupId =
    groupIdFromState || groupIdFromQuery || localStorage.getItem("groupId");
  // const account = useSelector((state) => state.account?.user || {});
  // const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  // const userData = account.email ? account : localUser;

  // Load initial data
  useEffect(() => {
    // Load templates, vehicles, and group members
    loadTemplates();
    if (groupId) {
      loadVehicles();
      loadGroupMembers();
      localStorage.setItem("groupId", groupId);
    }
  }, [groupId]);

  // Load contract templates
  const loadTemplates = async () => {
    try {
      const response = await api.get("/contract-templates");
      setTemplates(response.data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      message.error("Failed to load contract templates");
    }
  };

  // Load vehicles in group
  const loadVehicles = async () => {
    try {
      const response = await api.get(`/CoOwnership/${groupId}/vehicles`); ///${groupId}
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      message.error("Failed to load vehicles");
    }
  };

  // Load group members
  const loadGroupMembers = async () => {
    try {
      const response = await api.get(
        `/GroupMember/get-all-members-in-group/${groupId}`
      );
      setGroupMembers(response.data || []);
      console.log("Loaded group members:", response.data);
      setSelectedMembers([]);
      // Don't reset ownership shares to preserve user input
    } catch (error) {
      console.error("Error loading group members:", error);
      message.error("Failed to load group members");
    }
  };

  // Handle member selection for contract signing
  const handleMemberSelection = (memberId, isSelected) => {
    if (isSelected) {
      // Add member to selected members
      const member = groupMembers.find((m) => m.id === memberId);
      if (member) {
        setSelectedMembers((prev) => [...prev, member]);
        // Add to ownership shares if not already exists
        setOwnershipShares((prev) => {
          const existing = prev.find((s) => s.userId === memberId);
          if (!existing) {
            return [
              ...prev,
              {
                userId: memberId,
                rate: 0,
                userName: member.fullName || member.email || "Unknown",
              },
            ];
          }
          return prev;
        });
      }
    } else {
      // Remove member from selected members
      setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
      setOwnershipShares((prev) => prev.filter((s) => s.userId !== memberId));
    }
  };

  // Handle ownership share changes
  const handleOwnershipShareChange = (userId, rate) => {
    setOwnershipShares((prev) => {
      const existing = prev.find((share) => share.userId === userId);
      if (existing) {
        return prev.map((share) =>
          share.userId === userId ? { ...share, rate } : share
        );
      } else {
        const member = groupMembers.find((m) => m.userId === userId);
        return [
          ...prev,
          {
            userId,
            rate,
            userName: member?.fullName || member?.email || "Unknown",
          },
        ];
      }
    });
  };

  // Calculate total ownership percentage
  const totalOwnership = ownershipShares.reduce(
    (sum, share) => sum + (share.rate || 0),
    0
  );

  // Handle contract duration change
  const handleDurationChange = (duration) => {
    setContractDuration(duration);
    const effectiveFrom = form.getFieldValue("effectiveFrom");
    if (effectiveFrom) {
      const expiresAt = dayjs(effectiveFrom).add(duration, "month");
      form.setFieldsValue({ expiresAt });
    }
  };

  // Handle effective date change
  const handleEffectiveDateChange = (date) => {
    if (date) {
      const expiresAt = dayjs(date).add(contractDuration, "month");
      form.setFieldsValue({ expiresAt });
    }
  };

  const onFinish = async (values) => {
    // Validate ownership shares
    if (totalOwnership !== 100) {
      message.error(
        `Total ownership must be 100%. Current total: ${totalOwnership}%`
      );
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        templateId: values.templateId,
        groupId: groupId,
        vehicleId: values.vehicleId,
        effectiveFrom: values.effectiveFrom
          ? dayjs(values.effectiveFrom).toISOString()
          : dayjs().toISOString(),
        expiresAt: values.expiresAt
          ? dayjs(values.expiresAt).toISOString()
          : dayjs().add(contractDuration, "month").toISOString(),
        title: values.title,
        ownershipShares: ownershipShares.filter((share) => share.rate > 0),
      };

      const response = await api.post("/contracts", payload);
      toast.success("Contract created successfully!");
      setIsModalVisible(true);
      form.resetFields();
      setOwnershipShares([]);
      navigate("/my-contracts");
    } catch (error) {
      console.error(error);
      message.error("Failed to create contract. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-econtract-page">
      <div className="create-econtract-content">
        <div className="econ-wrapper-center">
          <Card className="econ-card animate-fade-up">
            <Title level={3} className="econ-main-title">
              Co-ownership Contract — EVCars
            </Title>

            <Paragraph className="econ-intro">
              Join the green revolution! Fill in the details below to create
              your co-ownership contract.
            </Paragraph>

            <Divider />

            <Form
              layout="vertical"
              form={form}
              onFinish={onFinish}
              className="econ-form"
              initialValues={{
                effectiveFrom: dayjs(),
                expiresAt: dayjs().add(6, "month"),
              }}
            >
              <Form.Item
                label="Contract Template"
                name="templateId"
                rules={[
                  { required: true, message: "Please select a template" },
                ]}
              >
                <Select placeholder="Select contract template">
                  {templates.map((template) => (
                    <Option key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Vehicle"
                name="vehicleId"
                rules={[{ required: true, message: "Please select a vehicle" }]}
              >
                <Select placeholder="Select vehicle">
                  {vehicles.map((vehicle) => (
                    <Option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} - {vehicle.licensePlate}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Contract Title"
                name="title"
                rules={[
                  { required: true, message: "Please enter contract title" },
                ]}
              >
                <Input placeholder="Enter contract title" />
              </Form.Item>

              <Form.Item
                label="Effective From"
                name="effectiveFrom"
                rules={[
                  { required: true, message: "Please select effective date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  onChange={handleEffectiveDateChange}
                />
              </Form.Item>

              <Form.Item
                label="Contract Duration (months)"
                name="duration"
                rules={[
                  {
                    required: true,
                    message: "Please select contract duration",
                  },
                ]}
              >
                <Select onChange={handleDurationChange}>
                  <Option value={6}>6 months</Option>
                  <Option value={12}>12 months (1 year)</Option>
                  <Option value={24}>24 months (2 years)</Option>
                  <Option value={36}>36 months (3 years)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Expires At" name="expiresAt">
                <DatePicker style={{ width: "100%" }} disabled />
              </Form.Item>

              {/* Select Members Section */}
              <Divider>Select Members to Sign Contract</Divider>

              <Table
                dataSource={groupMembers}
                pagination={false}
                size="small"
                rowKey="userId"
                rowSelection={{
                  type: "checkbox",
                  selectedRowKeys: selectedMembers.map((m) => m.userId),
                  onChange: (selectedRowKeys, selectedRows) => {
                    // Get current selected IDs
                    const currentSelectedIds = selectedMembers.map(
                      (m) => m.userId
                    );

                    // Find what changed
                    const newlySelected = selectedRowKeys.filter(
                      (id) => !currentSelectedIds.includes(id)
                    );
                    const newlyDeselected = currentSelectedIds.filter(
                      (id) => !selectedRowKeys.includes(id)
                    );

                    // Add newly selected members
                    newlySelected.forEach((memberId) => {
                      const member = groupMembers.find(
                        (m) => m.userId === memberId
                      );
                      if (member) {
                        setSelectedMembers((prev) => {
                          const newSelected = [...prev, member];
                          return newSelected;
                        });
                        setOwnershipShares((prev) => {
                          const existing = prev.find(
                            (s) => s.userId === memberId
                          );
                          if (!existing) {
                            const newShares = [
                              ...prev,
                              {
                                userId: memberId,
                                rate: 0,
                                userName:
                                  member.fullName || member.email || "Unknown",
                              },
                            ];
                            return newShares;
                          }
                          // If existing, keep the current rate value
                          return prev;
                        });
                      }
                    });

                    // Remove newly deselected members
                    newlyDeselected.forEach((memberId) => {
                      setSelectedMembers((prev) => {
                        const newSelected = prev.filter(
                          (m) => m.userId !== memberId
                        );
                        return newSelected;
                      });
                      // Don't remove ownership shares, just keep them for when user re-selects
                    });
                  },
                  getCheckboxProps: (record) => ({
                    // All members can be selected/deselected
                  }),
                }}
                columns={[
                  {
                    title: "Member",
                    dataIndex: "fullName",
                    key: "fullName",
                    render: (text, record) => (
                      <span>{text || record.email}</span>
                    ),
                  },
                  {
                    title: "Ownership %",
                    key: "ownership",
                    width: 200,
                    render: (_, record) => {
                      const share = ownershipShares.find(
                        (s) => s.userId === record.userId
                      );
                      return (
                        <InputNumber
                          min={0}
                          max={100}
                          value={share?.rate || 0}
                          onChange={(value) =>
                            handleOwnershipShareChange(
                              record.userId,
                              value || 0
                            )
                          }
                          style={{ width: "100%" }}
                          placeholder="0"
                        />
                      );
                    },
                  },
                ]}
              />

              {/* Total Ownership Display */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <Typography.Text strong>
                  Total Ownership: {totalOwnership}%
                  {totalOwnership !== 100 && (
                    <Tag
                      color={totalOwnership > 100 ? "red" : "orange"}
                      style={{ marginLeft: 8 }}
                    >
                      {totalOwnership > 100 ? "Exceeds 100%" : "Must be 100%"}
                    </Tag>
                  )}
                </Typography.Text>
              </div>

              <Form.Item className="econ-submit">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  size="large"
                >
                  {isLoading ? "Creating..." : "Create Contract"}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Modal
            title="Contract Created"
            open={isModalVisible}
            onOk={() => setIsModalVisible(false)}
            onCancel={() => setIsModalVisible(false)}
            okText="OK"
          >
            <p>Your contract has been successfully created and recorded.</p>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CreateEContract;
