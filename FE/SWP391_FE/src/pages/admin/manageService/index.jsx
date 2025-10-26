import React, { useState, useEffect } from "react";
import {
  Breadcrumb,
  Layout,
  theme,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Tag,
  Spin,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import api from "../../../config/axios";
import { toast } from "react-toastify";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

const ManageService = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedService, setSelectedService] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Fetch all service centers
  const fetchServiceCenters = async () => {
    setLoading(true);
    try {
      const response = await api.get("/service-centers");
      console.log("Service Centers Response:", response.data);

      if (response.data && response.data.data) {
        setServiceCenters(response.data.data);
      } else if (Array.isArray(response.data)) {
        setServiceCenters(response.data);
      } else {
        setServiceCenters([]);
      }
    } catch (error) {
      console.error("Error fetching service centers:", error);
      message.error("Failed to fetch service centers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  // Handle create service center
  const handleCreate = async (values) => {
    try {
      // Ensure isActive is a boolean, default to false if not provided
      const payload = {
        ...values,
        isActive: values.isActive !== undefined ? Boolean(values.isActive) : false,
      };
      const response = await api.post("/service-centers", payload);
      message.success("Service center created successfully!");
      setIsModalVisible(false);
      form.resetFields();
      fetchServiceCenters();
    } catch (error) {
      console.error("Error creating service center:", error);
      message.error(
        error.response?.data?.message || "Failed to create service center"
      );
    }
  };

  // Handle update service center
  const handleUpdate = async (values) => {
    try {
      // Ensure isActive is a boolean
      const payload = {
        ...values,
        isActive: Boolean(values.isActive),
      };
      const response = await api.put(
        `/service-centers/${selectedService.id}`,
        payload
      );
      message.success("Service center updated successfully!");
      setIsModalVisible(false);
      form.resetFields();
      setSelectedService(null);
      fetchServiceCenters();
    } catch (error) {
      console.error("Error updating service center:", error);
      message.error(
        error.response?.data?.message || "Failed to update service center"
      );
    }
  };

  // Handle delete service center
  const handleDelete = async (id) => {
    try {
      await api.delete(`/service-centers/${id}`);
      message.success("Service center deleted successfully!");
      fetchServiceCenters();
    } catch (error) {
      console.error("Error deleting service center:", error);
      message.error(
        error.response?.data?.message || "Failed to delete service center"
      );
    }
  };

  // Open modal for create
  const showCreateModal = () => {
    setModalMode("create");
    setSelectedService(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Open modal for edit
  const showEditModal = (record) => {
    setModalMode("edit");
    setSelectedService(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Handle modal submit
  const handleModalSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        if (modalMode === "create") {
          handleCreate(values);
        } else {
          handleUpdate(values);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedService(null);
  };

  // Filter service centers by search text
  const filteredServiceCenters = serviceCenters.filter((service) => {
    const searchLower = searchText.toLowerCase();
    return (
      service.name?.toLowerCase().includes(searchLower) ||
      service.address?.toLowerCase().includes(searchLower) ||
      service.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Format date helper - shorter format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Table columns
  const columns = [
    {
      title: <span style={{ fontSize: "9px" }}>Name</span>,
      dataIndex: "name",
      key: "name",
      width: 130,
      render: (text) => (
        <strong style={{ fontSize: "9px" }}>{text}</strong>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
    },
    {
      title: <span style={{ fontSize: "9px" }}>Address</span>,
      dataIndex: "address",
      key: "address",
      width: 180,
      render: (text) => (
        <span style={{ fontSize: "9px" }}>{text}</span>
      ),
      ellipsis: true,
    },
    {
      title: <span style={{ fontSize: "9px" }}>Phone</span>,
      dataIndex: "phone",
      key: "phone",
      width: 95,
      render: (text) => (
        <span style={{ fontSize: "9px" }}>{text}</span>
      ),
    },
    {
      title: <span style={{ fontSize: "9px" }}>Created</span>,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (text) => (
        <span style={{ fontSize: "8px" }}>{formatDate(text)}</span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: <span style={{ fontSize: "9px" }}>Updated</span>,
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 100,
      render: (text) => (
        <span style={{ fontSize: "8px" }}>{formatDate(text)}</span>
      ),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    },
    {
      title: <span style={{ fontSize: "9px" }}>Status</span>,
      dataIndex: "isActive",
      key: "isActive",
      width: 70,
      align: "center",
      render: (isActive) => {
        // Handle null/undefined values, default to true
        const active = isActive === undefined || isActive === null ? true : Boolean(isActive);
        return (
          <Tag
            color={active ? "green" : "red"}
            style={{ fontSize: "8px", padding: "0px 4px", margin: 0 }}
          >
            {active ? "ACT" : "INA"}
          </Tag>
        );
      },
    },
    {
      title: <span style={{ fontSize: "9px" }}>Actions</span>,
      key: "actions",
      width: 110,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={2}>
          <Button
            type="primary"
            icon={<EditOutlined style={{ fontSize: "9px" }} />}
            onClick={() => showEditModal(record)}
            size="small"
            style={{ fontSize: "8px", padding: "0px 4px", height: "22px" }}
          >
            Edit
          </Button>
          <Popconfirm
            title={<span style={{ fontSize: "11px" }}>Delete?</span>}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: "small", style: { fontSize: "10px" } }}
            cancelButtonProps={{ size: "small", style: { fontSize: "10px" } }}
          >
            <Button
              danger
              icon={<DeleteOutlined style={{ fontSize: "9px" }} />}
              size="small"
              style={{ fontSize: "8px", padding: "0px 4px", height: "22px" }}
            >
              Del
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-services"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "12px 0", fontSize: "10px" }}
            items={[
              { title: <span style={{ fontSize: "10px" }}>Home</span> },
              { title: <span style={{ fontSize: "10px" }}>Dashboard</span> },
              { title: <span style={{ fontSize: "10px" }}>Service Centers</span> },
            ]}
          />
          <div
            style={{
              padding: 16,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card className="service-card" bodyStyle={{ padding: "16px" }}>
              <div className="service-header" style={{ marginBottom: "12px" }}>
                <Title level={5} style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>
                  Service Center Management
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined style={{ fontSize: "10px" }} />}
                  onClick={showCreateModal}
                  size="small"
                  style={{ fontSize: "10px", height: "24px" }}
                >
                  Add New
                </Button>
              </div>

              {/* Search Bar */}
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined style={{ fontSize: "10px" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ 
                  marginBottom: 12, 
                  width: "100%", 
                  maxWidth: 300,
                  fontSize: "10px",
                  height: "26px"
                }}
                size="small"
                allowClear
              />

              {/* Table */}
              <div className="service-table">
                <Table
                  columns={columns}
                  dataSource={filteredServiceCenters}
                  rowKey="id"
                  loading={loading}
                  size="small"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total) => (
                      <span style={{ fontSize: "9px" }}>
                        Total {total}
                      </span>
                    ),
                    size: "small",
                  }}
                  bordered
                  style={{ fontSize: "9px" }}
                />
              </div>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center", fontSize: "11px", padding: "12px 50px" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>

      {/* Create/Edit Modal */}
      <Modal
        title={
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {modalMode === "create"
              ? "Create Service Center"
              : "Edit Service Center"}
          </span>
        }
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={480}
        okText={modalMode === "create" ? "Create" : "Update"}
        cancelText="Cancel"
        okButtonProps={{ size: "small", style: { fontSize: "10px" } }}
        cancelButtonProps={{ size: "small", style: { fontSize: "10px" } }}
        bodyStyle={{ padding: "16px" }}
      >
        <Form
          form={form}
          layout="vertical"
          name="serviceCenterForm"
          style={{ marginTop: 8 }}
        >
          <Form.Item
            label={<span style={{ fontSize: "10px", fontWeight: 500 }}>Name</span>}
            name="name"
            rules={[
              {
                required: true,
                message: "Please input the name!",
              },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input
              placeholder="Service center name"
              size="small"
              style={{ fontSize: "10px" }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: "10px", fontWeight: 500 }}>Address</span>}
            name="address"
            rules={[{ required: true, message: "Please input the address!" }]}
            style={{ marginBottom: 12 }}
          >
            <TextArea
              rows={2}
              placeholder="Full address"
              size="small"
              style={{ fontSize: "10px" }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: "10px", fontWeight: 500 }}>Phone</span>}
            name="phone"
            rules={[
              { required: true, message: "Please input the phone!" },
              {
                pattern: /^[0-9]{10,11}$/,
                message: "10-11 digits",
              },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input
              placeholder="0123456789"
              size="small"
              style={{ fontSize: "10px" }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: "10px", fontWeight: 500 }}>Active Status</span>}
            name="isActive"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <Switch size="small" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageService;
