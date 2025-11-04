import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Spin,
  Alert,
  Layout,
  theme,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Tooltip,
  Image,
  Descriptions,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  HomeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../config/axios";
import "./my-vehicle.css";

const { Header, Content, Footer } = Layout;

const MyVehicleRequests = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [myVehicles, setMyVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Form instances
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  // File upload states
  const [vehicleImageFileList, setVehicleImageFileList] = useState([]);
  const [registrationPaperFileList, setRegistrationPaperFileList] = useState(
    []
  );

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
      title: "Hãng",
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
      title: "Loại yêu cầu",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => {
        let color = type === "CREATE" ? "blue" : "orange";
        return (
          <Tag color={color}>{type === "CREATE" ? "TẠO MỚI" : "CẬP NHẬT"}</Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      filters: [
        { text: "Chờ duyệt", value: "PENDING" },
        { text: "Đã duyệt", value: "APPROVED" },
        { text: "Từ chối", value: "REJECTED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = "default";
        let text = status;
        if (status === "APPROVED") {
          color = "green";
          text = "Đã duyệt";
        }
        if (status === "REJECTED") {
          color = "red";
          text = "Từ chối";
        }
        if (status === "PENDING") {
          color = "orange";
          text = "Chờ duyệt";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => new Date(date).toLocaleString("vi-VN"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          {record.status === "PENDING" && (
            <Tooltip title="Xóa yêu cầu">
              <Button
                type="link"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteClick(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // API Functions
  const fetchMyVehicleRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/vehicle-requests/my-requests");
      const requests = response.data || [];

      // Sort by createdAt descending (newest first)
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllRequests(requests);
      setFilteredData(requests);
    } catch (err) {
      setError(err.message);
      message.error(`Không thể tải danh sách yêu cầu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const response = await api.get("/Vehicle/my-vehicles");

      // API có thể trả về data trong response.data.data hoặc response.data
      const vehicles = response.data.data || response.data || [];
      setMyVehicles(vehicles);
    } catch (err) {
      console.error("Failed to fetch my vehicles:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải danh sách xe của bạn";
      message.error(errorMessage);
    }
  };

  const fetchRequestDetail = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/vehicle-requests/${id}`);
      setLoading(false);

      // API có thể trả về data trực tiếp hoặc wrapped trong response
      const detail = response.data?.data || response.data;
      return detail;
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải chi tiết yêu cầu";
      message.error(errorMessage);
      return null;
    }
  };

  const handleViewDetail = async (id) => {
    const detail = await fetchRequestDetail(id);

    if (detail) {
      setSelectedRequest(detail);
      setDetailModalVisible(true);
    }
  };

  const handleDeleteClick = (record) => {
    console.log("Delete clicked for record:", record);

    // Chỉ cho phép xóa request có status PENDING
    if (record.status !== "PENDING") {
      console.log("Status is not PENDING, showing warning");
      message.warning("Chỉ có thể xóa yêu cầu đang chờ duyệt (PENDING)");
      return;
    }

    console.log("Setting requestToDelete and showing modal");
    setRequestToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      console.log("Deleting request with ID:", requestToDelete.id);
      setLoading(true);
      await api.delete(`/vehicle-requests/delete/${requestToDelete.id}`);
      toast.success("Xóa yêu cầu thành công");
      setDeleteModalVisible(false);
      setRequestToDelete(null);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("Delete request error:", err.response?.data);
      const errorMessage =
        err.response?.data?.message || err.message || "Không thể xóa yêu cầu";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setRequestToDelete(null);
  };

  const handleCreateClick = () => {
    fetchMyVehicles();
    setCreateModalVisible(true);
  };

  const handleUpdateClick = () => {
    fetchMyVehicles();
    setUpdateModalVisible(true);
  };

  const handleCreateSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate required files
      if (vehicleImageFileList.length === 0) {
        message.error("Vui lòng tải lên hình ảnh xe");
        setLoading(false);
        return;
      }
      if (registrationPaperFileList.length === 0) {
        message.error("Vui lòng tải lên giấy đăng ký xe");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("modelYear", values.modelYear);
      formData.append("color", values.color);
      formData.append("batteryCapacityKwh", values.batteryCapacityKwh);
      formData.append("rangeKm", values.rangeKm);
      formData.append("plateNumber", values.plateNumber);
      formData.append("vehicleImage", vehicleImageFileList[0].originFileObj);
      formData.append(
        "registrationPaperUrl",
        registrationPaperFileList[0].originFileObj
      );

      console.log("Create FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await api.post("/vehicle-requests/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Tạo yêu cầu xe mới thành công! Vui lòng chờ admin duyệt.");
      setCreateModalVisible(false);
      createForm.resetFields();
      setVehicleImageFileList([]);
      setRegistrationPaperFileList([]);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("Create request error:", err.response?.data);
      const errorData = err.response?.data;
      let errorMessage = "Không thể tạo yêu cầu";

      if (errorData?.errors) {
        const errors = Object.entries(errorData.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        errorMessage = errors;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate required files
      if (vehicleImageFileList.length === 0) {
        message.error("Vui lòng tải lên hình ảnh xe");
        setLoading(false);
        return;
      }
      if (registrationPaperFileList.length === 0) {
        message.error("Vui lòng tải lên giấy đăng ký xe");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("vehicleId", selectedVehicleId);
      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("modelYear", values.modelYear);
      formData.append("color", values.color);
      formData.append("batteryCapacityKwh", values.batteryCapacityKwh);
      formData.append("rangeKm", values.rangeKm);
      formData.append("plateNumber", values.plateNumber);
      formData.append("vehicleImage", vehicleImageFileList[0].originFileObj);
      formData.append(
        "registrationPaperUrl",
        registrationPaperFileList[0].originFileObj
      );

      console.log("Update FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await api.post("/vehicle-requests/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "Tạo yêu cầu cập nhật xe thành công! Vui lòng chờ admin duyệt."
      );
      setUpdateModalVisible(false);
      updateForm.resetFields();
      setVehicleImageFileList([]);
      setRegistrationPaperFileList([]);
      setSelectedVehicleId(null);
      fetchMyVehicleRequests();
    } catch (err) {
      console.error("Update request error:", err.response?.data);
      const errorData = err.response?.data;
      let errorMessage = "Không thể tạo yêu cầu cập nhật";

      if (errorData?.errors) {
        // Handle validation errors
        const errors = Object.entries(errorData.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        errorMessage = errors;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = myVehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      updateForm.setFieldsValue({
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        modelYear: vehicle.modelYear,
        color: vehicle.color,
        batteryCapacityKwh: vehicle.batteryCapacityKwh,
        rangeKm: vehicle.rangeKm,
      });
    }
  };

  // Open modals automatically when navigated to with query params
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get("create");
    const editId = params.get("edit");

    if (create) {
      // open create modal
      fetchMyVehicles();
      setCreateModalVisible(true);
    }

    if (editId) {
      // open update modal and preselect vehicle
      (async () => {
        await fetchMyVehicles();
        handleVehicleSelect(editId);
        setUpdateModalVisible(true);
      })();
    }
  }, [location.search]);

  const handleTableChange = (paginationConfig, filters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    fetchMyVehicleRequests();
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Load data on component mount
  useEffect(() => {
    fetchMyVehicleRequests();
  }, []);

  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    maxCount: 1,
    accept: "image/*",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ margin: "16px" }}>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="default"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          </div>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title={
                <span style={{ fontSize: "20px", fontWeight: "600" }}>
                  Yêu cầu xe của tôi
                </span>
              }
              extra={
                <Space>
                  <Input
                    placeholder="Tìm theo biển số, hãng hoặc model"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    allowClear
                    onClear={handleClearSearch}
                    style={{ width: 300 }}
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    Làm mới
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateClick}
                  >
                    Tạo yêu cầu xe mới
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={handleUpdateClick}>
                    Yêu cầu cập nhật xe
                  </Button>
                </Space>
              }
            >
              {error && (
                <Alert
                  message="Lỗi"
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
                      `${range[0]}-${range[1]} của ${total} yêu cầu`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 1200 }}
                />
              </Spin>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Vehicle Management System {new Date().getFullYear()}
        </Footer>
      </Layout>

      {/* Create Request Modal */}
      <Modal
        title="Tạo yêu cầu xe mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          setVehicleImageFileList([]);
          setRegistrationPaperFileList([]);
        }}
        footer={null}
        width={700}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            name="make"
            label="Hãng xe"
            rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
          >
            <Input placeholder="VD: Toyota, Honda, Vinfast..." />
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: "Vui lòng nhập model" }]}
          >
            <Input placeholder="VD: Vios, City, VF5..." />
          </Form.Item>

          <Form.Item
            name="modelYear"
            label="Năm sản xuất"
            rules={[{ required: true, message: "Vui lòng nhập năm sản xuất" }]}
          >
            <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="color"
            label="Màu sắc"
            rules={[{ required: true, message: "Vui lòng nhập màu sắc" }]}
          >
            <Input placeholder="VD: Trắng, Đen, Xanh..." />
          </Form.Item>

          <Form.Item
            name="batteryCapacityKwh"
            label="Dung lượng pin (kWh)"
            rules={[
              { required: true, message: "Vui lòng nhập dung lượng pin" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="rangeKm"
            label="Quãng đường (km)"
            rules={[{ required: true, message: "Vui lòng nhập quãng đường" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="plateNumber"
            label="Biển số xe"
            rules={[{ required: true, message: "Vui lòng nhập biển số xe" }]}
          >
            <Input placeholder="VD: 51F-12345" />
          </Form.Item>

          <Form.Item
            name="vehicleImage"
            label="Hình ảnh xe"
            rules={[
              { required: true, message: "Vui lòng tải lên hình ảnh xe" },
            ]}
          >
            <Upload
              {...uploadProps}
              fileList={vehicleImageFileList}
              onChange={({ fileList }) => setVehicleImageFileList(fileList)}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="registrationPaper"
            label="Giấy đăng ký xe"
            rules={[
              { required: true, message: "Vui lòng tải lên giấy đăng ký xe" },
            ]}
          >
            <Upload
              {...uploadProps}
              fileList={registrationPaperFileList}
              onChange={({ fileList }) =>
                setRegistrationPaperFileList(fileList)
              }
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Chọn giấy đăng ký</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space style={{ float: "right" }}>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  createForm.resetFields();
                  setVehicleImageFileList([]);
                  setRegistrationPaperFileList([]);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo yêu cầu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Request Modal */}
      <Modal
        title="Tạo yêu cầu cập nhật xe"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          updateForm.resetFields();
          setVehicleImageFileList([]);
          setRegistrationPaperFileList([]);
          setSelectedVehicleId(null);
        }}
        footer={null}
        width={700}
      >
        <Alert
          message="Chọn xe cần cập nhật"
          description="Vui lòng chọn xe từ danh sách xe của bạn, sau đó chỉnh sửa thông tin cần cập nhật."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item label="Chọn xe">
          <select
            className="ant-input"
            value={selectedVehicleId || ""}
            onChange={(e) => handleVehicleSelect(e.target.value)}
            style={{ width: "100%", padding: "4px 11px" }}
          >
            <option value="">-- Chọn xe --</option>
            {myVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </Form.Item>

        {selectedVehicleId && (
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateSubmit}
          >
            <Form.Item
              name="make"
              label="Hãng xe"
              rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
            >
              <Input placeholder="VD: Toyota, Honda, Vinfast..." />
            </Form.Item>

            <Form.Item
              name="model"
              label="Model"
              rules={[{ required: true, message: "Vui lòng nhập model" }]}
            >
              <Input placeholder="VD: Vios, City, VF5..." />
            </Form.Item>

            <Form.Item
              name="modelYear"
              label="Năm sản xuất"
              rules={[
                { required: true, message: "Vui lòng nhập năm sản xuất" },
              ]}
            >
              <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="color"
              label="Màu sắc"
              rules={[{ required: true, message: "Vui lòng nhập màu sắc" }]}
            >
              <Input placeholder="VD: Trắng, Đen, Xanh..." />
            </Form.Item>

            <Form.Item
              name="batteryCapacityKwh"
              label="Dung lượng pin (kWh)"
              rules={[
                { required: true, message: "Vui lòng nhập dung lượng pin" },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="rangeKm"
              label="Quãng đường (km)"
              rules={[{ required: true, message: "Vui lòng nhập quãng đường" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="plateNumber"
              label="Biển số xe"
              rules={[{ required: true, message: "Vui lòng nhập biển số xe" }]}
            >
              <Input placeholder="VD: 51F-12345" />
            </Form.Item>

            <Form.Item
              name="vehicleImage"
              label="Hình ảnh xe"
              rules={[
                { required: true, message: "Vui lòng tải lên hình ảnh xe" },
              ]}
            >
              <Upload
                {...uploadProps}
                fileList={vehicleImageFileList}
                onChange={({ fileList }) => setVehicleImageFileList(fileList)}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn hình ảnh mới</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="registrationPaper"
              label="Giấy đăng ký xe"
              rules={[
                { required: true, message: "Vui lòng tải lên giấy đăng ký xe" },
              ]}
            >
              <Upload
                {...uploadProps}
                fileList={registrationPaperFileList}
                onChange={({ fileList }) =>
                  setRegistrationPaperFileList(fileList)
                }
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn giấy đăng ký mới</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Space style={{ float: "right" }}>
                <Button
                  onClick={() => {
                    setUpdateModalVisible(false);
                    updateForm.resetFields();
                    setVehicleImageFileList([]);
                    setRegistrationPaperFileList([]);
                    setSelectedVehicleId(null);
                  }}
                >
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Tạo yêu cầu cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu xe"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedRequest(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID yêu cầu" span={2}>
                {selectedRequest.id}
              </Descriptions.Item>
              {selectedRequest.vehicleId && (
                <Descriptions.Item label="ID xe" span={2}>
                  {selectedRequest.vehicleId}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Loại yêu cầu">
                <Tag
                  color={selectedRequest.type === "CREATE" ? "blue" : "orange"}
                >
                  {selectedRequest.type === "CREATE" ? "TẠO MỚI" : "CẬP NHẬT"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    selectedRequest.status === "APPROVED"
                      ? "green"
                      : selectedRequest.status === "REJECTED"
                      ? "red"
                      : "orange"
                  }
                >
                  {selectedRequest.status === "APPROVED"
                    ? "Đã duyệt"
                    : selectedRequest.status === "REJECTED"
                    ? "Từ chối"
                    : "Chờ duyệt"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Biển số">
                {selectedRequest.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Hãng">
                {selectedRequest.make}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selectedRequest.model}
              </Descriptions.Item>
              <Descriptions.Item label="Năm">
                {selectedRequest.modelYear}
              </Descriptions.Item>
              <Descriptions.Item label="Màu">
                {selectedRequest.color}
              </Descriptions.Item>
              <Descriptions.Item label="Pin (kWh)">
                {selectedRequest.batteryCapacityKwh}
              </Descriptions.Item>
              <Descriptions.Item label="Quãng đường (km)">
                {selectedRequest.rangeKm}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {selectedRequest.createdByName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={2}>
                {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật" span={2}>
                {new Date(selectedRequest.updatedAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              {selectedRequest.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  <Alert
                    message={selectedRequest.rejectionReason}
                    type="error"
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {selectedRequest.vehicleImageUrl && (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Hình ảnh xe:
                    </div>
                    <Image
                      src={selectedRequest.vehicleImageUrl}
                      alt="Vehicle"
                      style={{ maxWidth: "100%", maxHeight: 300 }}
                      preview
                    />
                  </div>
                )}
                {selectedRequest.registrationPaperUrl && (
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Giấy đăng ký:
                    </div>
                    <Image
                      src={selectedRequest.registrationPaperUrl}
                      alt="Registration"
                      style={{ maxWidth: "100%", maxHeight: 300 }}
                      preview
                    />
                  </div>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa yêu cầu xe"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
        centered
        confirmLoading={loading}
      >
        {requestToDelete && (
          <div>
            <p>
              Bạn có chắc chắn muốn xóa yêu cầu{" "}
              <strong>
                {requestToDelete.type === "CREATE" ? "tạo mới" : "cập nhật"}
              </strong>{" "}
              xe <strong>{requestToDelete.plateNumber}</strong>?
            </p>
            <Alert
              message="Hành động này không thể hoàn tác!"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default MyVehicleRequests;
