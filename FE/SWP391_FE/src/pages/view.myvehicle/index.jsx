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
  Space,
  Typography,
  Tabs,
  Tag,
  Tooltip,
  Image,
  Descriptions,
} from "antd";
import "../view.myvehicle/my-vehicle.css";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  HomeOutlined,
  CopyOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useAuth } from "../../components/hooks/useAuth";

const { Header, Content, Footer, Sider } = Layout;
const { Option } = Select;
const { Title } = Typography;

// Helper function to normalize image list (same as in MyVehicleRequests.jsx)
const normalizeImageList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.vehicleImageUrl) return item.vehicleImageUrl;
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeImageList(parsed);
      }
    } catch (_) {
      // not JSON, fallback to delimiter split
    }
    return trimmed
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper function to get vehicle images from vehicle object
const getVehicleImages = (vehicle) => {
  if (!vehicle) return [];
  
  // Kiểm tra tất cả các field có thể chứa ảnh
  const possibleSources = [
    vehicle.vehicleImageUrl,
    vehicle.vehicleImageUrlList,
  ];
  
  // Lấy tất cả ảnh từ tất cả các nguồn
  const allImages = [];
  for (const source of possibleSources) {
    if (!source) continue;
    const list = normalizeImageList(source);
    if (list.length) {
      allImages.push(...list);
    }
  }
  
  // Loại bỏ duplicate và trả về
  return [...new Set(allImages)];
};

const MyVehicle = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCoOwner, isAdmin, isStaff } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const location = useLocation();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Forms
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Filter data when searchText changes
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(allRequests);
    } else {
      const filtered = allRequests.filter((request) => {
        const searchLower = searchText.toLowerCase();
        return (
          request.plateNumber?.toLowerCase().includes(searchLower) ||
          request.make?.toLowerCase().includes(searchLower) ||
          request.model?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredData(filtered);
    }
  }, [searchText, allRequests]);

  // Update displayed data when filteredData or pagination changes
  useEffect(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const paginatedData = filteredData.slice(
      startIndex,
      startIndex + pagination.pageSize
    );
    setData(paginatedData);
    setPagination((prev) => ({
      ...prev,
      total: filteredData.length,
    }));
  }, [filteredData, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Table columns definition
  const columns = [
    {
      title: "Biển số",
      dataIndex: "plateNumber",
      key: "plateNumber",
      width: 130,
      sorter: (a, b) =>
        (a.plateNumber || "").localeCompare(b.plateNumber || ""),
    },
    {
      title: "Hãng xe",
      dataIndex: "make",
      key: "make",
      width: 100,
      sorter: (a, b) => (a.make || "").localeCompare(b.make || ""),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 100,
      sorter: (a, b) => (a.model || "").localeCompare(b.model || ""),
    },
    {
      title: "Năm",
      dataIndex: "modelYear",
      key: "modelYear",
      width: 80,
      sorter: (a, b) => a.modelYear - b.modelYear,
    },
    {
      title: "Màu sắc",
      dataIndex: "color",
      key: "color",
      width: 100,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      filters: [
        { text: "Đã kích hoạt", value: "ACTIVE" },
        { text: "Chưa kích hoạt", value: "INACTIVE" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        if (status === "ACTIVE") {
          return <Tag color="green">Đã kích hoạt</Tag>;
        } else if (status === "INACTIVE") {
          return <Tag color="red">Chưa kích hoạt</Tag>;
        }
        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: "Nhóm",
      dataIndex: "hasGroup",
      key: "hasGroup",
      width: 100,
      filters: [
        { text: "Có nhóm", value: true },
        { text: "Chưa có nhóm", value: false },
      ],
      onFilter: (value, record) => record.hasGroup === value,
      render: (hasGroup) => {
        if (hasGroup === true) {
          return <Tag color="blue">Có nhóm</Tag>;
        } else {
          return <Tag color="default">Chưa có</Tag>;
        }
      },
    },
    {
      title: "Pin (kWh)",
      dataIndex: "batteryCapacityKwh",
      key: "batteryCapacityKwh",
      width: 120,
    },
    {
      title: "Phạm vi (km)",
      dataIndex: "rangeKm",
      key: "rangeKm",
      width: 100,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        const handleMenuClick = ({ key }) => {
          console.log("Menu item clicked:", key, "for vehicle ID:", record.id);
          if (key === "edit") {
            console.log(
              "Edit action triggered - navigate to vehicle requests page"
            );
            navigate(`/my-vehicle-requests?edit=${record.id}`);
          } else if (key === "copy") {
            console.log("Copy ID action triggered");
            handleCopyId(record.id);
          }
        };

        const menuItems = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Chỉnh sửa",
          },
          // {
          //   key: "copy",
          //   icon: <CopyOutlined />,
          //   label: "Sao chép ID",
          // },
        ];

        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: menuItems,
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
                  console.log(
                    "Dropdown button clicked for vehicle:",
                    record.id
                  );
                }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // API Functions
  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/Vehicle/my-vehicles");
      const vehicles = response.data || [];

      // Sort by newest first if there's a creation date
      const sortedVehicles = [...vehicles].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });

      setAllRequests(sortedVehicles);
      setFilteredData(sortedVehicles);
      setError(null);
    } catch (err) {
      setError(err.message);
      message.error(`Không thể tải danh sách xe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (values) => {
    if (isCreating) return; // Prevent multiple submissions

    setIsCreating(true);
    try {
      console.log("Creating vehicle with values:", values);

      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color || null,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
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
      }
      message.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const updateVehicle = async (id, values) => {
    setIsUpdating(true);
    try {
      console.log("Updating vehicle with ID:", id);
      console.log("Update values:", values);

      const requestBody = {
        make: values.make,
        model: values.model,
        modelYear: parseInt(values.modelYear),
        color: values.color || null,
        batteryCapacityKwh: parseFloat(values.batteryCapacityKwh),
        rangeKm: parseInt(values.rangeKm),
        plateNumber: values.plateNumber,
      };

      console.log("Request body:", requestBody);
      console.log("API URL:", `${api.defaults.baseURL}/Vehicle/${id}`);

      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      const response = await api.put(`/Vehicle/${id}`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Update response:", response);
      console.log("Update response data:", response.data);
      console.log("Update response status:", response.status);

      if (response.status === 200 || response.status === 204) {
        message.success("Vehicle updated successfully");
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditingRecord(null);
        await fetchVehicles(pagination.current, pagination.pageSize);
      } else {
        console.log("Unexpected response status:", response.status);
        message.error("Update failed: Unexpected response");
      }
    } catch (err) {
      console.error("Update error:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Failed to update vehicle";
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
      console.log("Full vehicleRecord:", vehicleRecord);
      console.log("vehicleRecord.status:", vehicleRecord.status);
      const status = vehicleRecord.status?.toLowerCase();
      console.log("Checking vehicle status before delete:", status);

      if (status !== "inactive") {
        toast.warning("You can only delete vehicles with INACTIVE status");
        return;
      }

      console.log("Starting deleteVehicle with ID:", vehicleRecord.id);
      // Use query parameter as per Swagger API
      const response = await api.delete("/Vehicle/delete-vehicle-by-id", {
        params: { id: vehicleRecord.id },
      });
      console.log("Delete response:", response);

      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success("Vehicle deleted successfully");
      }

      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Delete error:", err);
      console.error("Error response:", err.response);

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

  // Event handlers
  const handleTableChange = (paginationConfig, filters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
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
    console.log("handleDelete called with vehicle:", vehicleRecord);
    deleteVehicle(vehicleRecord);
  };

  const handleCopyId = async (vehicleId) => {
    try {
      await navigator.clipboard.writeText(vehicleId);
      message.success(`Vehicle ID copied to clipboard: ${vehicleId}`);
    } catch (err) {
      console.error("Failed to copy ID:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = vehicleId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        message.success(`Vehicle ID copied to clipboard: ${vehicleId}`);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleViewDetail = async (vehicle) => {
    console.log("View detail clicked for:", vehicle.id);

    try {
      setLoading(true);
      // Call API to get full vehicle details
      const response = await api.get(
        `/Vehicle/get-vehicle-by-id?id=${vehicle.id}`
      );
      console.log("Vehicle detail response:", response.data);

      setSelectedVehicle(response.data);
      setDetailModalVisible(true);
    } catch (err) {
      console.error("Error fetching vehicle detail:", err);

      // Nếu API lỗi, vẫn hiển thị thông tin có sẵn
      setSelectedVehicle(vehicle);
      setDetailModalVisible(true);

      message.warning(
        "Không thể tải chi tiết đầy đủ, hiển thị thông tin cơ bản"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation based on role
  const handleBack = () => {
    if (isStaff) {
      navigate("/staff/dashboard");
    } else if (isAdmin) {
      navigate("/admin/dashboard");
    } else if (isCoOwner) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    // If search is cleared, reset to full data
    if (!value || value.trim() === "") {
      setFilteredData(data);
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    setFilteredData(data);
  };

  return (
    <>
      <Layout style={{ minHeight: "calc(100vh - 64px - 200px)" }}>
        <Content style={{ margin: "24px 16px 0" }}>
          <div style={{ marginBottom: 16, display: "flex", gap: "8px" }}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={() => fetchVehicles()}
              loading={loading}
            >
              Làm mới
            </Button>
          </div>

          <Tabs
            activeKey={location.pathname}
            onChange={(key) => navigate(key)}
            items={[
              { key: "/view-myvehicle", label: "Danh sách các xe" },
              { key: "/my-vehicle-requests", label: "Yêu cầu đăng ký xe" },
            ]}
            style={{ marginBottom: 16 }}
          />

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

            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: "8px",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchVehicles()}
                  loading={loading}
                >
                  Làm mới
                </Button>
              </Space>

              <Input
                placeholder="Tìm theo biển số, hãng hoặc model"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearch}
                allowClear
                onClear={handleClearSearch}
                style={{ width: 350 }}
              />
            </div>

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>Quản lý xe ©2024</Footer>

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

                <Form.Item name="color" label="Color (Optional)">
                  <Input placeholder="Enter vehicle color (optional)" />
                </Form.Item>

                <Form.Item
                  name="batteryCapacityKwh"
                  label="Battery Capacity (kWh)"
                  rules={[
                    {
                      required: true,
                      message: "Please input battery capacity!",
                    },
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
              </div>

              <div className="vehicle-form-actions">
                <Button
                  onClick={() => {
                    setIsAddModalVisible(false);
                    addForm.resetFields();
                  }}
                  disabled={isCreating}
                >
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
            <Form form={editForm} layout="vertical" onFinish={onEditFinish}>
              <div className="vehicle-form-grid">
                <Form.Item
                  name="plateNumber"
                  label="Plate Number"
                  rules={[
                    { required: true, message: "Please input plate number!" },
                  ]}
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

                <Form.Item name="color" label="Color (Optional)">
                  <Input placeholder="Enter vehicle color (optional)" />
                </Form.Item>

                <Form.Item
                  name="batteryCapacityKwh"
                  label="Battery Capacity (kWh)"
                  rules={[
                    {
                      required: true,
                      message: "Please input battery capacity!",
                    },
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
          title="Xóa xe"
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
          okText="Xác nhận xóa"
          cancelText="Hủy"
          okType="danger"
          className="delete-confirmation-modal"
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <DeleteOutlined
              style={{ color: "#ff4d4f", fontSize: 20, marginRight: 8 }}
            />
            <span>Bạn có chắc chắn muốn xóa xe này không?</span>
          </div>
        </Modal>

        {/* Vehicle Detail Modal */}
        <Modal
          title="Chi tiết xe"
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setSelectedVehicle(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setDetailModalVisible(false);
                setSelectedVehicle(null);
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          {selectedVehicle && (
            <div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Biển số">
                  {selectedVehicle.plateNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color="green">Đã duyệt</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Hãng xe">
                  {selectedVehicle.make}
                </Descriptions.Item>
                <Descriptions.Item label="Model">
                  {selectedVehicle.model}
                </Descriptions.Item>
                <Descriptions.Item label="Năm">
                  {selectedVehicle.modelYear}
                </Descriptions.Item>
                <Descriptions.Item label="Màu sắc">
                  {selectedVehicle.color || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Pin (kWh)">
                  {selectedVehicle.batteryCapacityKwh}
                </Descriptions.Item>
                <Descriptions.Item label="Phạm vi (km)">
                  {selectedVehicle.rangeKm}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 16 }}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {(() => {
                    const vehicleImages = getVehicleImages(selectedVehicle);
                    console.log("Vehicle images to display:", vehicleImages);
                    if (!vehicleImages.length) {
                      return (
                        <div>
                          <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                            Hình ảnh xe:
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 200,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#f0f0f0",
                              border: "1px dashed #d9d9d9",
                              borderRadius: 8,
                            }}
                          >
                            <span style={{ color: "#999" }}>
                              Chưa có hình ảnh xe
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                          Hình ảnh xe:
                        </div>
                        <Space wrap size="middle">
                          {vehicleImages.map((img, index) => {
                            // Đảm bảo URL là string hợp lệ
                            const imageUrl = typeof img === 'string' ? img : (img?.url || img?.imageUrl || '');
                            if (!imageUrl) {
                              console.warn(`Invalid image URL at index ${index}:`, img);
                              return null;
                            }
                            return (
                              <Image
                                key={`${imageUrl}-${index}`}
                                src={imageUrl}
                                alt={`Vehicle ${index + 1}`}
                                style={{
                                  width: 180,
                                  height: 150,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                }}
                                preview
                                onError={(e) => {
                                  console.error(`Failed to load image at index ${index}:`, imageUrl);
                                  e.target.style.display = 'none';
                                }}
                              />
                            );
                          })}
                        </Space>
                      </div>
                    );
                  })()}
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Giấy đăng ký xe:
                    </div>
                    {selectedVehicle.registrationPaperUrl ? (
                      <Image
                        src={selectedVehicle.registrationPaperUrl}
                        alt="Registration"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 300,
                          objectFit: "cover",
                        }}
                        preview
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 200,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f0f0f0",
                          border: "1px dashed #d9d9d9",
                          borderRadius: 8,
                        }}
                      >
                        <span style={{ color: "#999" }}>
                          Chưa có giấy đăng ký xe
                        </span>
                      </div>
                    )}
                  </div>
                </Space>
              </div>
            </div>
          )}
        </Modal>
      </Layout>
    </>
  );
};

export default MyVehicle;
