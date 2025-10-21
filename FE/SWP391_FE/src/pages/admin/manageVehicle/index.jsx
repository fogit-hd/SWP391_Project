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
  Tag,
  Tooltip,
} from "antd";
import "./vehicle-management.css";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
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

  // Form instances
  const [addForm] = Form.useForm();

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
      align: "center",
      render: (_, record) => {
        return (
          <Tooltip title="Delete vehicle">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              style={{ padding: 0 }}
              onClick={() => {
                console.log("Delete button clicked for vehicle:", record.id);
                setVehicleToDelete(record);
                setDeleteModalVisible(true);
              }}
            />
          </Tooltip>
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
      console.log("Creating vehicle with values:", values);

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

      console.log("Create request body:", requestBody);
      const response = await api.post("/Vehicle/create", requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Create response:", response);

      if (response.data.message) {
        message.success(response.data.message);
      } else {
        message.success("Vehicle created successfully");
      }

      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Create error:", err);
      console.error("Error response:", err.response);

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

  const deleteVehicle = async (vehicleRecord) => {
    try {
      // Check if vehicle status is inactive before deleting
      console.log('Full vehicleRecord:', vehicleRecord);
      console.log('vehicleRecord.status:', vehicleRecord.status);
      const status = vehicleRecord.status?.toLowerCase();
      console.log('Checking vehicle status before delete:', status);
      
      if (status !== 'inactive') {
        toast.warning('Only vehicles with INACTIVE status can be deleted');
        return;
      }
      
      console.log('Starting deleteVehicle with ID:', vehicleRecord.id);
      const deleteUrl = `/Vehicle/delete-vehicle-by-id`;
      console.log('Delete URL:', deleteUrl);
      
      const response = await api.delete(deleteUrl, {
        params: { id: vehicleRecord.id }
      });
      console.log('Delete response:', response);

      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success("Vehicle deleted successfully");
      }

      fetchVehicles();
    } catch (err) {
      console.error('Delete error:', err);
      console.error('Error response:', err.response);

      let errorMessage = "Failed to delete vehicle";
      if (err.response) {
        errorMessage = `Failed to delete vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleDelete = (vehicleRecord) => {
    console.log('handleDelete called with vehicle:', vehicleRecord);
    deleteVehicle(vehicleRecord);
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    const { current, pageSize } = paginationConfig;
    const { field, order } = sorter;

    fetchVehicles(current, pageSize, field, order, filters);
  };

  const handleRefresh = () => {
    fetchVehicles(pagination.current, pagination.pageSize);
  };

  const handleAddVehicle = () => {
    setIsAddModalVisible(true);
  };

  const onAddFinish = (values) => {
    createVehicle(values);
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
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>
              <Link to="/dashboard">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Vehicle Management</Breadcrumb.Item>
          </Breadcrumb>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title="Manage Vehicles"
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
              }
            >
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  closable
                  style={{ marginBottom: 16 }}
                  onClose={() => setError(null)}
                />
              )}

              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    ...pagination,
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
          Vehicle Management System {new Date().getFullYear()}
        </Footer>
      </Layout>

      <Modal
        title="Delete Vehicle"
        open={deleteModalVisible}
        onOk={() => {
          console.log(
            "Delete confirmed - calling handleDelete with vehicle:",
            vehicleToDelete
          );
          handleDelete(vehicleToDelete);
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 20, marginRight: 8 }} />
          <span>Are you sure you want to delete this vehicle?</span>
        </div>
        {vehicleToDelete && vehicleToDelete.status?.toLowerCase() !== 'inactive' && (
          <Alert
            message="Warning"
            description="Only vehicles with INACTIVE status can be deleted."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default ManageVehicle;
