import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Spin,
  Alert,
  Breadcrumb,
  Layout,
  theme,
  Modal,
  Form,
  Input,
  InputNumber,
  Dropdown,
  Tag,
  Tooltip,
} from "antd";
import "./vehicle-management.css";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import api from "../../../config/axios";
import AdminSidebar from "../../../components/admin/AdminSidebar";

const { Header, Content, Footer } = Layout;

const ManageVehicle = () => {
  // Layout state
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [statusChangeRecord, setStatusChangeRecord] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form instances
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
      ellipsis: true,
      render: (id) => <Tooltip title={id}>{id.substring(0, 8)}...</Tooltip>,
    },
    {
      title: "Plate Number",
      dataIndex: "plateNumber",
      key: "plateNumber",
      width: 150,
      fixed: "left",
      sorter: true,
    },
    {
      title: "Make",
      dataIndex: "make",
      key: "make",
      sorter: true,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      sorter: true,
    },
    {
      title: "Year",
      dataIndex: "modelYear",
      key: "modelYear",
      sorter: true,
      width: 80,
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      filters: [{ text: "INACTIVE", value: "INACTIVE" }],
      render: (status) => {
        let color = "default";
        if (status === "ACTIVE" || status === "Active") color = "green";
        if (status === "INACTIVE" || status === "Inactive") color = "red";
        if (status === "MAINTENANCE") color = "orange";

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Battery (kWh)",
      dataIndex: "batteryCapacityKwh",
      key: "batteryCapacityKwh",
      width: 120,
    },
    {
      title: "Range (km)",
      dataIndex: "rangeKm",
      key: "rangeKm",
      width: 100,
    },
    {
      title: "Device ID",
      dataIndex: "telematicsDeviceId",
      key: "telematicsDeviceId",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      fixed: "right",
      render: (_, record) => {
        const handleMenuClick = ({ key }) => {
          console.log("Menu item clicked:", key, "for vehicle ID:", record.id);
          if (key === "edit") {
            console.log("Edit action triggered");
            handleEdit(record);
          } else if (key === "delete") {
            console.log("Delete action triggered - showing confirmation modal");
            setVehicleToDelete(record);
            setDeleteModalVisible(true);
          }
        };

        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                },
              ],
              onClick: handleMenuClick,
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              className="vehicle-action-button"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Dropdown button clicked for vehicle:", record.id);
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  // API Functions
  const fetchVehicles = async (
    page = 1,
    pageSize = 10,
    sortField = null,
    sortOrder = null,
    filters = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/Vehicle/get-all-vehicle");
      const vehicles = response.data || [];

      // Apply client-side filtering and sorting
      let filteredData = vehicles;

      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        filteredData = filteredData.filter((item) =>
          filters.status.some(
            (status) => item.status.toUpperCase() === status.toUpperCase()
          )
        );
      }

      // Apply sorting
      if (sortField && sortOrder) {
        filteredData.sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          if (sortOrder === "ascend") {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filteredData.slice(
        startIndex,
        startIndex + pageSize
      );

      setData(paginatedData);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: filteredData.length,
      }));
    } catch (err) {
      setError(err.message);
      message.error(`Failed to fetch vehicles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (values) => {
    try {
      console.log("Creating vehicle with values:", values); // Debug log

      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
        telematicsDeviceId: values.telematicsDeviceId,
      };

      console.log("Create request body:", requestBody); // Debug log
      const response = await api.post("/Vehicle/create", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Create response:", response); // Debug log

      if (response.data.message) {
        message.success(response.data.message);
      } else {
        message.success("Vehicle created successfully");
      }

      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Create error:", err); // Debug log
      console.error("Error response:", err.response); // Debug log

      let errorMessage = "Failed to create vehicle";
      if (err.response) {
        errorMessage = `Failed to create vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = err.message;
      }

      message.error(errorMessage);
    }
  };

  const updateVehicle = async (id, values) => {
    setIsUpdating(true);
    try {
      console.log("Updating vehicle with ID:", id); // Debug log
      console.log("Update values:", values); // Debug log

      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
        telematicsDeviceId: values.telematicsDeviceId,
      };

      console.log("Request body:", requestBody); // Debug log
      console.log("API URL:", `${api.defaults.baseURL}/Vehicle/${id}`); // Debug log

      // Check if token exists
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token); // Debug log

      const response = await api.put(`/Vehicle/${id}`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Update response:", response); // Debug log

      if (response.data.message) {
        message.success(response.data.message);
      } else {
        message.success("Vehicle updated successfully");
      }

      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingRecord(null);
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Update error:", err); // Debug log
      console.error("Error response:", err.response); // Debug log
      console.error("Error request:", err.request); // Debug log

      let errorMessage = "Failed to update vehicle";
      if (err.response) {
        // Server responded with error status
        errorMessage = `Failed to update vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = err.message;
      }

      message.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Status change function temporarily disabled - no API available
  // const changeVehicleStatus = async (id, newStatus) => {
  //   try {
  //     const endpoint = newStatus === "ACTIVE" ?
  //       `/Vehicle/activate-vehicle?vehicleId=${id}` :
  //       `/Vehicle/deactivate-vehicle?vehicleId=${id}`;

  //     await api.patch(endpoint);
  //     message.success(`Vehicle ${newStatus.toLowerCase()}d successfully`);
  //     fetchVehicles(pagination.current, pagination.pageSize);
  //   } catch (err) {
  //     message.error(`Failed to change vehicle status: ${err.message}`);
  //   }
  // };

  const deleteVehicle = async (vehicleId) => {
    try {
      console.log("Starting delete for vehicle ID:", vehicleId); // Debug log
      const response = await api.delete(
        `/Vehicle/delete-vehicle-by-id?id=${vehicleId}`
      );
      console.log("Delete response:", response); // Debug log
      message.success("Vehicle deleted successfully");
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Delete error:", err); // Debug log
      message.error(`Failed to delete vehicle: ${err.message}`);
    }
  };

  // Event Handlers
  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      make: record.make,
      model: record.model,
      modelYear: record.modelYear,
      color: record.color,
      batteryCapacityKwh: record.batteryCapacityKwh,
      rangeKm: record.rangeKm,
      plateNumber: record.plateNumber,
      telematicsDeviceId: record.telematicsDeviceId,
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = (id) => {
    console.log("handleDelete called with ID:", id);
    deleteVehicle(id);
  };

  // Status change handler temporarily disabled - no API available
  // const handleStatusChange = (record, newStatus) => {
  //   changeVehicleStatus(record.id, newStatus);
  // };

  const handleAddVehicle = () => {
    setIsAddModalVisible(true);
  };

  const handleRefresh = () => {
    fetchVehicles(pagination.current, pagination.pageSize);
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    const { current, pageSize } = paginationConfig;
    const { field, order } = sorter;

    fetchVehicles(current, pageSize, field, order, filters);
  };

  const onAddFinish = (values) => {
    createVehicle(values);
  };

  const onEditFinish = (values) => {
    console.log("Edit form submitted with values:", values); // Debug log
    console.log("Editing record:", editingRecord); // Debug log

    if (!editingRecord || !editingRecord.id) {
      message.error("No vehicle selected for editing");
      return;
    }

    updateVehicle(editingRecord.id, values);
  };

  // Load data on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-vehicles"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={[
              { title: "Home" },
              { title: "Dashboard" },
              { title: "Manage Vehicles" },
            ]}
          />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title="Vehicle Management"
              extra={
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddVehicle}
                  >
                    Add Vehicle
                  </Button>
                </Space>
              }
            >
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button size="small" onClick={handleRefresh}>
                      Retry
                    </Button>
                  }
                />
              )}

              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} vehicles`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 1400 }}
                />
              </Spin>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Vehicle Management System ©{new Date().getFullYear()}
        </Footer>
      </Layout>

      {/* Add Vehicle Modal */}
      <Modal
        title="Add New Vehicle"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        footer={null}
        width={700}
        className="vehicle-modal"
        destroyOnClose
        centered={false}
        style={{ top: 20 }}
      >
        <div className="vehicle-form">
          <Form form={addForm} layout="vertical" onFinish={onAddFinish}>
            <div className="vehicle-form-grid">
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[
                  { required: true, message: "Please input plate number!" },
                ]}
              >
                <Input placeholder="Enter plate number" />
              </Form.Item>

              <Form.Item
                name="make"
                label="Make"
                rules={[{ required: true, message: "Please input make!" }]}
              >
                <Input placeholder="Enter vehicle make (e.g., Honda, Toyota)" />
              </Form.Item>

              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: "Please input model!" }]}
              >
                <Input placeholder="Enter vehicle model" />
              </Form.Item>

              <Form.Item
                name="modelYear"
                label="Model Year"
                rules={[
                  { required: true, message: "Please input model year!" },
                ]}
              >
                <InputNumber
                  placeholder="Enter model year"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>

              <Form.Item
                name="color"
                label="Color"
                rules={[{ required: true, message: "Please input color!" }]}
              >
                <Input placeholder="Enter vehicle color" />
              </Form.Item>

              <Form.Item
                name="batteryCapacityKwh"
                label="Battery Capacity (kWh)"
                rules={[
                  { required: true, message: "Please input battery capacity!" },
                ]}
              >
                <InputNumber
                  placeholder="Enter battery capacity"
                  min={0}
                  step={0.1}
                />
              </Form.Item>

              <Form.Item
                name="rangeKm"
                label="Range (km)"
                rules={[{ required: true, message: "Please input range!" }]}
              >
                <InputNumber placeholder="Enter vehicle range" min={0} />
              </Form.Item>

              <Form.Item
                name="telematicsDeviceId"
                label="Telematics Device ID"
                rules={[{ required: true, message: "Please input device ID!" }]}
              >
                <Input placeholder="Enter telematics device ID" />
              </Form.Item>
            </div>

            <div className="vehicle-form-actions">
              <Button
                onClick={() => {
                  setIsAddModalVisible(false);
                  addForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Vehicle
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        title="Edit Vehicle"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
        width={700}
        className="vehicle-modal"
        destroyOnClose
        centered={false}
        style={{ top: 20 }}
      >
        <div className="vehicle-form">
          <Form form={editForm} layout="vertical" onFinish={onEditFinish}>
            <div className="vehicle-form-grid">
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[
                  { required: true, message: "Please input plate number!" },
                ]}
              >
                <Input placeholder="Enter plate number" />
              </Form.Item>

              <Form.Item
                name="make"
                label="Make"
                rules={[{ required: true, message: "Please input make!" }]}
              >
                <Input placeholder="Enter vehicle make" />
              </Form.Item>

              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: "Please input model!" }]}
              >
                <Input placeholder="Enter vehicle model" />
              </Form.Item>

              <Form.Item
                name="modelYear"
                label="Model Year"
                rules={[
                  { required: true, message: "Please input model year!" },
                ]}
              >
                <InputNumber
                  placeholder="Enter model year"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>

              <Form.Item
                name="color"
                label="Color"
                rules={[{ required: true, message: "Please input color!" }]}
              >
                <Input placeholder="Enter vehicle color" />
              </Form.Item>

              <Form.Item
                name="batteryCapacityKwh"
                label="Battery Capacity (kWh)"
                rules={[
                  { required: true, message: "Please input battery capacity!" },
                ]}
              >
                <InputNumber
                  placeholder="Enter battery capacity"
                  min={0}
                  step={0.1}
                />
              </Form.Item>

              <Form.Item
                name="rangeKm"
                label="Range (km)"
                rules={[{ required: true, message: "Please input range!" }]}
              >
                <InputNumber placeholder="Enter vehicle range" min={0} />
              </Form.Item>

              <Form.Item
                name="telematicsDeviceId"
                label="Telematics Device ID"
                rules={[{ required: true, message: "Please input device ID!" }]}
              >
                <Input placeholder="Enter telematics device ID" />
              </Form.Item>
            </div>

            <div className="vehicle-form-actions">
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setEditingRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Update Vehicle
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Vehicle"
        open={deleteModalVisible}
        onOk={() => {
          console.log(
            "Delete confirmed - calling handleDelete with ID:",
            vehicleToDelete?.id
          );
          handleDelete(vehicleToDelete?.id);
          setDeleteModalVisible(false);
          setVehicleToDelete(null);
        }}
        onCancel={() => {
          console.log("Delete cancelled");
          setDeleteModalVisible(false);
          setVehicleToDelete(null);
        }}
        okText="Yes, Delete"
        cancelText="Cancel"
        okType="danger"
        className="delete-confirmation-modal"
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <DeleteOutlined
            style={{ color: "#ff4d4f", fontSize: 20, marginRight: 8 }}
          />
          <span>Are you sure you want to delete this vehicle?</span>
        </div>
      </Modal>
    </Layout>
  );
};

export default ManageVehicle;
