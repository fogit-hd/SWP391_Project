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
import { ArrowLeftOutlined } from "@ant-design/icons";
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
      message.error("Không thể tải mẫu hợp đồng");
    }
  };

  // Load vehicles in group
  const loadVehicles = async () => {
    try {
      const response = await api.get(`/CoOwnership/${groupId}/vehicles`); ///${groupId}
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      message.error("Không thể tải danh sách xe");
    }
  };

  // Load group members
  const loadGroupMembers = async () => {
    try {
      const response = await api.get(
        `/GroupMember/get-all-members-in-group/${groupId}`
      );
      const members = response.data || [];
      setGroupMembers(members);
      console.log("Loaded group members:", members);
      
      // Auto-select all members and initialize ownership shares
      setSelectedMembers(members);
      setOwnershipShares(
        members.map((member) => ({
          userId: member.userId || member.id,
          rate: 0,
          userName: member.fullName || member.email || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error loading group members:", error);
      message.error("Không thể tải thành viên nhóm");
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
        const member = groupMembers.find(
          (m) => (m.userId || m.id) === userId
        );
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
        `Tổng tỷ lệ sở hữu phải là 100%. Hiện tại: ${totalOwnership}%`
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
      toast.success("Tạo hợp đồng thành công!");
      setIsModalVisible(true);
      form.resetFields();
      setOwnershipShares([]);
      navigate("/view-mycontract");
    } catch (error) {
      console.error(error);
      message.error("Không thể tạo hợp đồng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/view-mygroup", {
      state: { groupId: groupId, openGroupModal: true },
    });
  };

  return (
    <div className="create-econtract-page">
      <div className="create-econtract-content">
        <div className="econ-wrapper-center">
          <Card className="econ-card animate-fade-up">
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              >
                Quay lại
              </Button>
            </Space>
            <Title level={3} className="econ-main-title">
              Co-ownership Contract — EVCars
            </Title>

            <Paragraph className="econ-intro">
              Tham gia cuộc cách mạng xanh! Điền thông tin bên dưới để tạo
              hợp đồng đồng sở hữu của bạn.
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
                label="Mẫu hợp đồng"
                name="templateId"
                rules={[
                  { required: true, message: "Vui lòng chọn mẫu hợp đồng" },
                ]}
              >
                <Select placeholder="Chọn mẫu hợp đồng">
                  {templates.map((template) => (
                    <Option key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Xe"
                name="vehicleId"
                rules={[{ required: true, message: "Vui lòng chọn xe" }]}
              >
                <Select placeholder="Chọn xe">
                  {vehicles.map((vehicle) => {
                    const make = vehicle.make || vehicle.brand || "";
                    const model = vehicle.model || "";
                    const plate = vehicle.plateNumber || vehicle.licensePlate || "";
                    
                    let displayText = "";
                    if (make && model && plate) {
                      displayText = `${make} ${model} - ${plate}`;
                    } else if (make && model) {
                      displayText = `${make} ${model}`;
                    } else if (plate) {
                      displayText = plate;
                    } else {
                      displayText = vehicle.vehicleName || vehicle.name || vehicle.id || "Xe không xác định";
                    }
                    
                    return (
                      <Option key={vehicle.id} value={vehicle.id}>
                        {displayText}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                label="Tiêu đề hợp đồng"
                name="title"
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề hợp đồng" },
                ]}
              >
                <Input placeholder="Nhập tiêu đề hợp đồng" />
              </Form.Item>

              <Form.Item
                label="Có hiệu lực từ"
                name="effectiveFrom"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày có hiệu lực" },
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
                label="Thời hạn hợp đồng (tháng)"
                name="duration"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời hạn hợp đồng",
                  },
                ]}
              >
                <Select onChange={handleDurationChange}>
                  <Option value={6}>6 tháng</Option>
                  <Option value={12}>12 tháng (1 năm)</Option>
                  <Option value={24}>24 tháng (2 năm)</Option>
                  <Option value={36}>36 tháng (3 năm)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Hết hạn vào" name="expiresAt">
                <DatePicker style={{ width: "100%" }} disabled />
              </Form.Item>

              {/* Members Section */}
              <Divider>Thành viên tham gia hợp đồng</Divider>

              <Table
                dataSource={groupMembers}
                pagination={false}
                size="small"
                rowKey="userId"
                columns={[
                  {
                    title: "Thành viên",
                    dataIndex: "fullName",
                    key: "fullName",
                    render: (text, record) => (
                      <span>{text || record.email}</span>
                    ),
                  },
                  {
                    title: "Tỷ lệ sở hữu %",
                    key: "ownership",
                    width: 200,
                    render: (_, record) => {
                      const userId = record.userId || record.id;
                      const share = ownershipShares.find(
                        (s) => s.userId === userId
                      );
                      return (
                        <InputNumber
                          min={0}
                          max={100}
                          value={share?.rate || 0}
                          onChange={(value) =>
                            handleOwnershipShareChange(
                              userId,
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
                  Tổng tỷ lệ sở hữu: {totalOwnership}%
                  {totalOwnership !== 100 && (
                    <Tag
                      color={totalOwnership > 100 ? "red" : "orange"}
                      style={{ marginLeft: 8 }}
                    >
                      {totalOwnership > 100 ? "Vượt quá 100%" : "Phải là 100%"}
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
                  {isLoading ? "Đang tạo..." : "Tạo hợp đồng"}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Modal
            title="Đã tạo hợp đồng"
            open={isModalVisible}
            onOk={() => setIsModalVisible(false)}
            onCancel={() => setIsModalVisible(false)}
            okText="Đồng ý"
          >
            <p>Hợp đồng của bạn đã được tạo và ghi nhận thành công.</p>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CreateEContract;
