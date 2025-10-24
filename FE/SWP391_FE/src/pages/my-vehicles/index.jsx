import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  message,
  Alert,
  Breadcrumb,
  Layout,
  theme,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Dropdown,
} from "antd";
import "../my-vehicles/my-vehicle.css";
import {
  CarOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  HomeOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { toast } from "react-toastify";
import AppHeader from "../../components/reuse/AppHeader";
import AppFooter from "../../components/reuse/AppFooter";

const { Header, Content, Footer, Sider } = Layout;
const { Option } = Select;

const MyVehicle = () => {
  const navigate = useNavigate();
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
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Forms
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchVehicles(pagination.current, pagination.pageSize);
  }, []);

  // Table columns definition
  const columns = [
    {
      title: "Plate Number",
      dataIndex: "plateNumber",
      key: "plateNumber",
      width: 120,
      fixed: 'left',
      sorter: true,
    },
    {
      title: "Make",
      dataIndex: "make",
      key: "make",
      width: 120,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 120,
    },
    {
      title: "Year",
      dataIndex: "modelYear",
      key: "modelYear",
      width: 80,
      sorter: true,
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      width: 100,
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
      title: "Action",
      key: "action",
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        const handleMenuClick = ({ key }) => {
          console.log('Menu item clicked:', key, 'for vehicle ID:', record.id);
          if (key === 'edit') {
            console.log('Edit action triggered');
            handleEdit(record);
          } else if (key === 'copy') {
            console.log('Copy ID action triggered');
            handleCopyId(record.id);
          } else if (key === 'delete') {
            console.log('Delete action triggered - showing confirmation');
            setVehicleToDelete(record);
            setDeleteModalVisible(true);
          }
        };

        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Edit',
                },
                {
                  key: 'copy',
                  icon: <CopyOutlined />,
                  label: 'Copy ID',
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  danger: true,
                },
              ],
              onClick: handleMenuClick,
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              className="vehicle-action-button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Dropdown button clicked for vehicle:', record.id);
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
    try {
      const response = await api.get("/Vehicle/my-vehicles", {
        params: {
          page,
          pageSize,
          sortField,
          sortOrder,
          ...filters,
        },
      });

      const vehiclesData = response.data.data || response.data || [];
      const total = response.data.total || vehiclesData.length;

      setData(vehiclesData);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: total,
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
      message.error(`Failed to fetch vehicles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (values) => {
    if (isCreating) return; // Prevent multiple submissions
    
    setIsCreating(true);
    try {
      console.log('Creating vehicle with values:', values);
      
      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color || null,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
      };

      console.log('Create request body:', requestBody);
      const response = await api.post("/Vehicle/create", requestBody, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Create response:', response);
      
      if (response.data.message) {
        message.success(response.data.message);
      } else {
        message.success("Vehicle created successfully");
      }
      
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('Create error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to create vehicle';
      if (err.response) {
        errorMessage = `Failed to create vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      message.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const updateVehicle = async (id, values) => {
    setIsUpdating(true);
    try {
      console.log('Updating vehicle with ID:', id);
      console.log('Update values:', values);
      
      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color || null,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
      };

      console.log('Request body:', requestBody);
      console.log('API URL:', `${api.defaults.baseURL}/Vehicle/${id}`);
      
      const token = localStorage.getItem("token");
      console.log('Token exists:', !!token);
      
      const response = await api.put(`/Vehicle/${id}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Update response:', response);
      console.log('Update response data:', response.data);
      console.log('Update response status:', response.status);
      
      if (response.status === 200 || response.status === 204) {
        message.success("Vehicle updated successfully");
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingRecord(null);
        await fetchVehicles(pagination.current, pagination.pageSize);
      } else {
        console.log('Unexpected response status:', response.status);
        message.error("Update failed: Unexpected response");
      }
    } catch (err) {
      console.error('Update error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to update vehicle';
      if (err.response) {
        errorMessage = `Failed to update vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      message.error(errorMessage);
    } finally {
      setIsUpdating(false);
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
        toast.warning('You can only delete vehicles with INACTIVE status');
        return;
      }
      
      console.log('Starting deleteVehicle with ID:', vehicleRecord.id);
      // Use query parameter as per Swagger API
      const response = await api.delete('/Vehicle/delete-vehicle-by-id', {
        params: { id: vehicleRecord.id }
      });
      console.log('Delete response:', response);
      
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success("Vehicle deleted successfully");
      }
      
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('Delete error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to delete vehicle';
      if (err.response) {
        errorMessage = `Failed to delete vehicle: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  // Event handlers
  const handleTableChange = (pagination, filters, sorter) => {
    setSortField(sorter.field);
    setSortOrder(sorter.order);
    fetchVehicles(
      pagination.current,
      pagination.pageSize,
      sorter.field,
      sorter.order,
      filters
    );
  };

  const onAddFinish = (values) => {
    console.log("Add form submitted with values:", values);
    createVehicle(values);
  };

  const onEditFinish = (values) => {
    console.log("Edit form submitted with values:", values);
    console.log("Editing record:", editingRecord);
    if (editingRecord) {
      updateVehicle(editingRecord.id, values);
    }
  };

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
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = (vehicleRecord) => {
    console.log('handleDelete called with vehicle:', vehicleRecord);
    deleteVehicle(vehicleRecord);
  };

  const handleCopyId = async (vehicleId) => {
    try {
      await navigator.clipboard.writeText(vehicleId);
      message.success(`Vehicle ID copied to clipboard: ${vehicleId}`);
    } catch (err) {
      console.error('Failed to copy ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = vehicleId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success(`Vehicle ID copied to clipboard: ${vehicleId}`);
      } catch (fallbackErr) {
        message.error('Failed to copy ID to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <AppHeader />
      <Layout style={{ minHeight: "calc(100vh - 64px - 200px)" }}>
        <Content style={{ margin: "24px 16px 0" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>My Vehicles</Breadcrumb.Item>
          </Breadcrumb>

        <div
          style={{
            padding: 24,
            minHeight: 360,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 16, display: "flex", gap: "8px" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
            >
              Add Vehicle
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchVehicles(pagination.current, pagination.pageSize)}
            >
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} vehicles`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </div>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        Vehicle Management ©2024
      </Footer>

      {/* Add Vehicle Modal */}
      <Modal
        title="Add New Vehicle"
        open={isAddModalVisible}
        onCancel={() => {
          if (!isCreating) {
            setIsAddModalVisible(false);
            addForm.resetFields();
          }
        }}
        footer={null}
        width={700}
        className="vehicle-modal"
        destroyOnClose
        centered={false}
        style={{ top: 20 }}
        closable={!isCreating}
        maskClosable={!isCreating}
      >
        <div className="vehicle-form">
          <Form
            form={addForm}
            layout="vertical"
            onFinish={onAddFinish}
          >
            <div className="vehicle-form-grid">
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[{ required: true, message: "Please input plate number!" }]}
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
                rules={[{ required: true, message: "Please input model year!" }]}
              >
                <InputNumber
                  placeholder="Enter model year"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>

              <Form.Item
                name="color"
                label="Color (Optional)"
              >
                <Input placeholder="Enter vehicle color (optional)" />
              </Form.Item>

              <Form.Item
                name="batteryCapacityKwh"
                label="Battery Capacity (kWh)"
                rules={[{ required: true, message: "Please input battery capacity!" }]}
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
                <InputNumber
                  placeholder="Enter vehicle range"
                  min={0}
                />
              </Form.Item>
            </div>

            <div className="vehicle-form-actions">
              <Button onClick={() => {
                setIsAddModalVisible(false);
                addForm.resetFields();
              }} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isCreating}>
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
          <Form
            form={editForm}
            layout="vertical"
            onFinish={onEditFinish}
          >
            <div className="vehicle-form-grid">
              <Form.Item
                name="plateNumber"
                label="Plate Number"
                rules={[{ required: true, message: "Please input plate number!" }]}
              >
                <Input placeholder="Enter plate number" disabled />
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
                rules={[{ required: true, message: "Please input model year!" }]}
              >
                <InputNumber
                  placeholder="Enter model year"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>

              <Form.Item
                name="color"
                label="Color (Optional)"
              >
                <Input placeholder="Enter vehicle color (optional)" />
              </Form.Item>

              <Form.Item
                name="batteryCapacityKwh"
                label="Battery Capacity (kWh)"
                rules={[{ required: true, message: "Please input battery capacity!" }]}
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
                <InputNumber
                  placeholder="Enter vehicle range"
                  min={0}
                />
              </Form.Item>
            </div>

            <div className="vehicle-form-actions">
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setEditingRecord(null);
              }}>
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
          console.log('Delete confirmed - calling handleDelete with vehicle:', vehicleToDelete);
          handleDelete(vehicleToDelete);
          setDeleteModalVisible(false);
          setVehicleToDelete(null);
        }}
        onCancel={() => {
          console.log('Delete cancelled');
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
      </Modal>
      </Layout>
      <AppFooter />
    </>
  );
};

export default MyVehicle;
