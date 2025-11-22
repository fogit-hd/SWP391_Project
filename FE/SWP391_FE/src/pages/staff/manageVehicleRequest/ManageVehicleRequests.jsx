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
  Tag,
  Tooltip,
  Image,
  Descriptions,
} from "antd";
import "./vehicle-requests.css";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../../../config/axios";
import StaffSidebar from "../../../components/staff/StaffSidebar";

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

const ManageVehicleRequests = () => {
  // Layout state
  const [collapsed, setCollapsed] = useState(false);
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Form instances
  const [rejectForm] = Form.useForm();

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
          request.model?.toLowerCase().includes(searchLower) ||
          request.createdByName?.toLowerCase().includes(searchLower)
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
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      ellipsis: true,
      render: (id) => <Tooltip title={id}>{id.substring(0, 8)}...</Tooltip>,
    },
    {
      title: "Plate Number",
      dataIndex: "plateNumber",
      key: "plateNumber",
      width: 130,
      sorter: (a, b) =>
        (a.plateNumber || "").localeCompare(b.plateNumber || ""),
    },
    {
      title: "Make",
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
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => {
        let color = type === "CREATE" ? "blue" : "orange";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      filters: [
        { text: "Pending", value: "PENDING" },
        { text: "Approved", value: "APPROVED" },
        { text: "Rejected", value: "REJECTED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = "default";
        if (status === "APPROVED") color = "green";
        if (status === "REJECTED") color = "red";
        if (status === "PENDING") color = "orange";

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Created By",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        console.log(
          "Rendering actions for record:",
          record.id,
          "status:",
          record.status
        );
        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => {
                  console.log("View detail clicked for:", record.id);
                  handleViewDetail(record.id);
                }}
              />
            </Tooltip>
            {record.status === "PENDING" && (
              <>
                <Tooltip title="Approve">
                  <Button
                    type="link"
                    icon={<CheckOutlined />}
                    style={{ color: "green" }}
                    onClick={() => {
                      console.log(
                        "Approve button clicked for:",
                        record.id,
                        "Type:",
                        record.type
                      );
                      handleApproveClick(record);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Reject">
                  <Button
                    type="link"
                    icon={<CloseOutlined />}
                    danger
                    onClick={() => {
                      console.log("Reject button clicked for:", record.id);
                      handleRejectClick(record.id);
                    }}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // API Functions
  const fetchVehicleRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/vehicle-requests/all");
      const requests = response.data || [];
      console.log("Fetched vehicle requests:", requests);

      // Sort by createdAt descending (newest first)
      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllRequests(requests);
      setFilteredData(requests);
    } catch (err) {
      console.error("Fetch vehicle requests error:", err);
      setError(err.message);
      message.error(`Failed to fetch vehicle requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetail = async (id) => {
    try {
      const response = await api.get(`/vehicle-requests/${id}`);
      return response.data;
    } catch (err) {
      message.error(`Failed to fetch request detail: ${err.message}`);
      return null;
    }
  };

  const handleViewDetail = async (id) => {
    setLoading(true);
    const detail = await fetchRequestDetail(id);
    setLoading(false);

    if (detail) {
      setSelectedRequest(detail);
      setDetailModalVisible(true);
    }
  };

  const handleApproveClick = (record) => {
    console.log("Approve clicked for record:", record);
    setSelectedRequest(record);
    setApproveModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const requestType = selectedRequest.type;
      const requestId = selectedRequest.id;

      console.log("Approving request - Type:", requestType, "ID:", requestId);

      let response;
      if (requestType === "CREATE") {
        // Use PUT for CREATE type
        console.log("Calling approve-create API");
        response = await api.put(
          `/vehicle-requests/approve-create/${requestId}`
        );
      } else if (requestType === "UPDATE") {
        // Use POST for UPDATE type
        console.log("Calling approve-update API");
        response = await api.post(
          `/vehicle-requests/approve-update/${requestId}`
        );
      } else {
        throw new Error(`Unknown request type: ${requestType}`);
      }

      console.log("Approve response:", response);

      // Hiển thị message từ backend
      const successMessage =
        response.data?.message || `Phê duyệt yêu cầu ${requestType} thành công`;
      toast.success(successMessage);

      setApproveModalVisible(false);
      setSelectedRequest(null);
      await fetchVehicleRequests();
    } catch (err) {
      console.error("Approve error:", err);
      console.error("Error response:", err.response);

      // Xử lý lỗi từ backend
      const errorData = err.response?.data;
      const errorMessage =
        errorData?.message ||
        (errorData?.errors &&
          Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")) ||
        (errorData?.title?.includes("Validation") &&
          "Thông tin không hợp lệ") ||
        (typeof errorData === "string" && errorData) ||
        errorData?.error ||
        err.message ||
        "Không thể phê duyệt yêu cầu";

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id) => {
    console.log("Reject clicked for ID:", id);
    setSelectedRequest({ id });
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setLoading(true);

      console.log(
        "Sending reject request for ID:",
        selectedRequest.id,
        "with reason:",
        values.reason
      );
      const response = await api.put(
        `/vehicle-requests/reject/${selectedRequest.id}`,
        null,
        {
          params: {
            reason: values.reason,
          },
        }
      );
      console.log("Reject response:", response);

      // Hiển thị message từ backend
      const successMessage =
        response.data?.message || "Đã từ chối yêu cầu thành công";
      toast.success(successMessage);

      setRejectModalVisible(false);
      rejectForm.resetFields();
      fetchVehicleRequests();
    } catch (err) {
      if (err.errorFields) {
        // Validation error từ form
        return;
      }

      console.error("Reject error:", err);
      console.error("Error response:", err.response);

      // Xử lý lỗi từ backend
      const errorData = err.response?.data;
      const errorMessage =
        errorData?.message ||
        (errorData?.errors &&
          Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")) ||
        (errorData?.title?.includes("Validation") &&
          "Thông tin không hợp lệ") ||
        (typeof errorData === "string" && errorData) ||
        errorData?.error ||
        err.message ||
        "Không thể từ chối yêu cầu";

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    fetchVehicleRequests();
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const renderImageSection = (title, urlData) => {
    if (!urlData) return null;

    let urls = [];
    try {
      // Check if it looks like a JSON array
      if (
        typeof urlData === "string" &&
        urlData.trim().startsWith("[") &&
        urlData.trim().endsWith("]")
      ) {
        const parsed = JSON.parse(urlData);
        if (Array.isArray(parsed)) {
          urls = parsed;
        } else {
          urls = [urlData];
        }
      } else {
        urls = [urlData];
      }
    } catch (e) {
      urls = [urlData];
    }

    if (urls.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>{title}:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Image.PreviewGroup>
            {urls.map((url, index) => (
              <Image
                key={index}
                src={url}
                alt={`${title} ${index + 1}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                }}
                width={200}
              />
            ))}
          </Image.PreviewGroup>
        </div>
      </div>
    );
  };

  // Load data on component mount
  useEffect(() => {
    fetchVehicleRequests();
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <StaffSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-vehicle-requests"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title="Manage Vehicle Requests"
              extra={
                <Space>
                  <Input
                    placeholder="Search by Plate, Make, Model or User"
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
                    Refresh
                  </Button>
                </Space>
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
                      `${range[0]}-${range[1]} of ${total} requests`,
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

      {/* Detail Modal */}
      <Modal
        title="Vehicle Request Details"
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
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Type">
                <Tag
                  color={selectedRequest.type === "CREATE" ? "blue" : "orange"}
                >
                  {selectedRequest.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={
                    selectedRequest.status === "APPROVED"
                      ? "green"
                      : selectedRequest.status === "REJECTED"
                      ? "red"
                      : "orange"
                  }
                >
                  {selectedRequest.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Plate Number">
                {selectedRequest.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Make">
                {selectedRequest.make}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selectedRequest.model}
              </Descriptions.Item>
              <Descriptions.Item label="Year">
                {selectedRequest.modelYear}
              </Descriptions.Item>
              <Descriptions.Item label="Color">
                {selectedRequest.color}
              </Descriptions.Item>
              <Descriptions.Item label="Battery (kWh)">
                {selectedRequest.batteryCapacityKwh}
              </Descriptions.Item>
              <Descriptions.Item label="Range (km)">
                {selectedRequest.rangeKm}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedRequest.createdByName}
              </Descriptions.Item>
              <Descriptions.Item label="Created At" span={2}>
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At" span={2}>
                {new Date(selectedRequest.updatedAt).toLocaleString()}
              </Descriptions.Item>
              {selectedRequest.rejectionReason && (
                <Descriptions.Item label="Rejection Reason" span={2}>
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
                {renderImageSection(
                  "Vehicle Image",
                  selectedRequest.vehicleImageUrl
                )}
                {renderImageSection(
                  "Registration Paper",
                  selectedRequest.registrationPaperUrl
                )}
              </Space>
            </div>

            {selectedRequest.status === "PENDING" && (
              <div style={{ marginTop: 16, textAlign: "right" }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleApproveClick(selectedRequest);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setDetailModalVisible(false);
                      handleRejectClick(selectedRequest.id);
                    }}
                  >
                    Reject
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        title={`Approve Vehicle Request - ${selectedRequest?.type || ""}`}
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setSelectedRequest(null);
        }}
        okText="Approve"
        okType="primary"
        cancelText="Cancel"
        confirmLoading={loading}
        centered
      >
        {selectedRequest && (
          <>
            <Alert
              message={`Are you sure you want to approve this ${selectedRequest.type} request?`}
              description={
                selectedRequest.type === "CREATE"
                  ? "This action will create a new vehicle in the system."
                  : "This action will update the vehicle information in the system."
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Plate Number">
                {selectedRequest.plateNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Make">
                {selectedRequest.make}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selectedRequest.model}
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                <Tag
                  color={selectedRequest.type === "CREATE" ? "blue" : "orange"}
                >
                  {selectedRequest.type}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Vehicle Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedRequest(null);
          rejectForm.resetFields();
        }}
        okText="Reject"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={loading}
        centered
      >
        <Alert
          message="Please provide a reason for rejection"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[
              {
                required: true,
                message: "Please provide a reason for rejection",
              },
              {
                min: 10,
                message: "Reason must be at least 10 characters",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter the reason for rejecting this request..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageVehicleRequests;
