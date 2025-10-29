import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Spin,
  message,
  Typography,
  Form,
  Input,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
} from "antd";
import { useAuth } from "../../../components/hooks/useAuth";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import TechnicianSidebar from "../../../components/technician/TechnicianSidebar";
import dayjs from "dayjs";

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ReviewService = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isStaff, isTechnician, roleId } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [allServicesData, setAllServicesData] = useState([]); // Store all services data
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedContractContent, setSelectedContractContent] = useState("");
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [estimateModalVisible, setEstimateModalVisible] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // Filter status - Both Admin and Technician can filter
  const [selectedType, setSelectedType] = useState("ALL"); // Filter by service type
  const [sortOrder, setSortOrder] = useState("DESC"); // Sort by date: DESC (newest first) or ASC (oldest first)
  
  /**
   * Service Request Status Flow:
   * 1. draft - Vừa tạo xong
   * 2. pending_quote - Technician đã đặt lịch kiểm tra
   * 3. voting - Technician đã báo giá, đang chờ members vote
   * 4. approved - Tất cả members đã vote đồng ý
   * 5. rejected - Bị từ chối
   * 6. in_progress - Sau khi tất cả thanh toán hóa đơn xong
   * 7. completed - Technician đã hoàn thành công việc
   */
  const [scheduleForm] = Form.useForm();
  const [estimateForm] = Form.useForm();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    // Allow Admin and Technician to access this page
    if (!isAdmin && !isTechnician && roleId !== 1 && roleId !== 4) {
      toast.error("You don't have permission to access this page");
      navigate("/");
      return;
    }

    loadContracts();
  }, [isAuthenticated, isAdmin, isTechnician, roleId, navigate]);

  // Filter and sort contracts
  const filterAndSortContracts = (contractsList, status, type, order) => {
    let filtered = contractsList;

    // Filter by status
    if (status !== "ALL") {
      filtered = filtered.filter((service) => {
        const serviceStatus =
          service.status || service.state || service.contractStatus;
        return serviceStatus === status;
      });
    }

    // Filter by type
    if (type !== "ALL") {
      filtered = filtered.filter((service) => service.type === type);
    }

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return order === "DESC" ? dateB - dateA : dateA - dateB;
    });

    setContracts(sorted);
    console.log(`📋 Filtered: status=${status}, type=${type}, sort=${order}, results=${sorted.length}`);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterAndSortContracts(allServicesData, status, selectedType, sortOrder);
  };

  // Handle type filter change
  const handleTypeChange = (type) => {
    setSelectedType(type);
    filterAndSortContracts(allServicesData, selectedStatus, type, sortOrder);
  };

  // Handle sort order change
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    filterAndSortContracts(allServicesData, selectedStatus, selectedType, order);
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      console.log("📞 Calling API: GET /contracts");
      console.log("🔍 Current roleId:", roleId);
      console.log("🔍 isStaff:", isStaff);
      console.log("🔍 isAdmin:", isAdmin);

      const response = await api.get("/service-requests");
      console.log("📦 Full response:", response);
      console.log("📦 Response.data:", response.data);

      let allServicesData = [];
      if (response.data && Array.isArray(response.data.data)) {
        allServicesData = response.data.data;
        console.log("✅ Using response.data.data");
      } else if (Array.isArray(response.data)) {
        allServicesData = response.data;
        console.log("✅ Using response.data");
      } else if (response.data?.contracts) {
        allServicesData = response.data.contracts;
        console.log("✅ Using response.data.contracts");
      }

      console.log("📊 Total services from API:", allServicesData.length);

      // Debug: Log all service statuses with detailed info
      console.log(
        "🔍 All service statuses:",
        allServicesData.map((c) => ({
          id: c.id,
          status: c.status,
          state: c.state,
          contractStatus: c.contractStatus,
          title: c.title,
          allFields: Object.keys(c),
        }))
      );

      // Store all services
      setAllServicesData(allServicesData);

      // Apply filter and sort
      console.log("👤 Applying filters:", { selectedStatus, selectedType, sortOrder });
      filterAndSortContracts(allServicesData, selectedStatus, selectedType, sortOrder);
    } catch (error) {
      console.error("❌ Error:", error);
      message.error("Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = (service) => {
    setSelectedServiceId(service.id);
    setSelectedService(service);
    
    // Pre-fill form with existing data if available
    scheduleForm.setFieldsValue({
      inspectionScheduledAt: service.inspectionScheduledAt 
        ? dayjs(service.inspectionScheduledAt) 
        : null,
      inspectionNotes: service.inspectionNotes || "",
    });
    
    setScheduleModalVisible(true);
  };

  // Open Estimate Modal
  const handleOpenEstimateModal = (service) => {
    setSelectedServiceId(service.id);
    setSelectedService(service);
    
    // Pre-fill form with existing estimate (NO default value)
    estimateForm.setFieldsValue({
      costEstimate: service.costEstimate || undefined,
      estimateNotes: service.estimateNotes || "",
    });
    
    setEstimateModalVisible(true);
  };

  // Submit Inspection Schedule
  const handleScheduleSubmit = async (values) => {
    try {
      setScheduleLoading(true);
      
      const payload = {
        inspectionScheduledAt: values.inspectionScheduledAt 
          ? values.inspectionScheduledAt.toISOString() 
          : null,
        inspectionNotes: values.inspectionNotes || "",
      };

      console.log("📅 Updating schedule for service:", selectedServiceId);
      console.log("📦 Payload:", payload);
      console.log("👤 Current user role:", { roleId, isAdmin, isTechnician });

      const response = await api.put(`/service-requests/${selectedServiceId}/schedule`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("✅ Schedule updated successfully:", response.data);
      toast.success("Inspection schedule updated! Status changed to 'Pending Quote'");
      setScheduleModalVisible(false);
      scheduleForm.resetFields();
      loadContracts();
    } catch (error) {
      console.error("❌ Error updating schedule:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error message:", error.response?.data?.message);
      
      toast.error(
        error.response?.data?.message || "Failed to update inspection schedule"
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  // Submit Estimate
  const handleEstimateSubmit = async (values) => {
    try {
      setEstimateLoading(true);
      
      const payload = {
        costEstimate: values.costEstimate,
        estimateNotes: values.estimateNotes || "",
      };

      console.log("💰 Updating estimate for service:", selectedServiceId);
      console.log("📦 Payload:", payload);
      console.log("👤 Current user role:", { roleId, isAdmin, isTechnician });
      console.log("🔑 Token:", localStorage.getItem("token")?.substring(0, 50) + "...");

      const response = await api.put(`/service-requests/${selectedServiceId}/estimate`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("✅ Estimate updated successfully:", response.data);
      toast.success("Quote submitted successfully! Status changed to 'Voting'");
      setEstimateModalVisible(false);
      estimateForm.resetFields();
      loadContracts();
    } catch (error) {
      console.error("❌ Error updating estimate:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error message:", error.response?.data?.message);
      
      toast.error(
        error.response?.data?.message || "Failed to update cost estimate"
      );
    } finally {
      setEstimateLoading(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      render: (id) => (
        <span style={{ fontSize: "12px" }}>{id?.substring(0, 6)}...</span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: true,
      render: (text) => <span style={{ fontSize: "13px" }}>{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type) => {
        const typeMap = {
          MAINTENANCE: { color: "blue", text: "Maintenance" },
          REPAIR: { color: "orange", text: "Repair" },
          INSPECTION: { color: "green", text: "Inspection" },
          CLEANING: { color: "cyan", text: "Cleaning" },
          UPGRADE: { color: "purple", text: "Upgrade" },
        };
        const typeInfo = typeMap[type] || { color: "default", text: type };
        return (
          <Tag color={typeInfo.color} style={{ fontSize: "11px", margin: 0 }}>
            {typeInfo.text}
          </Tag>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 90,
      render: (date) => {
        if (!date) return <span style={{ fontSize: "12px" }}>N/A</span>;
        try {
          return (
            <span style={{ fontSize: "12px" }}>
              {new Date(date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </span>
          );
        } catch (error) {
          return <span style={{ fontSize: "12px" }}>Invalid</span>;
        }
      },
    },
    {
      title: "Schedule",
      dataIndex: "inspectionScheduledAt",
      key: "inspectionScheduledAt",
      width: 115,
      render: (date) => {
        if (!date || date === null || date === undefined)
          return (
            <Tag color="default" style={{ fontSize: "11px", margin: 0 }}>
              Not Set
            </Tag>
          );
        try {
          const dateObj = new Date(date);
          return (
            <div style={{ fontSize: "11px", lineHeight: "1.3" }}>
              <div style={{ fontWeight: "600" }}>
                {dateObj.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </div>
              <div style={{ color: "#666" }}>
                {dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        } catch (error) {
          return (
            <Tag color="default" style={{ fontSize: "11px", margin: 0 }}>
              Not Set
            </Tag>
          );
        }
      },
    },
    {
      title: "Cost",
      dataIndex: "costEstimate",
      key: "costEstimate",
      width: 100,
      render: (costEstimate) => {
        // Check if costEstimate is null, undefined, or 0
        if (costEstimate === null || costEstimate === undefined || costEstimate === 0) {
          return (
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#999",
                fontStyle: "italic",
              }}
            >
              NONE
            </span>
          );
        }
        return (
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#52c41a",
            }}
          >
            {(costEstimate / 1000).toFixed(0)}K
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const statusMap = {
          draft: {
            color: "default",
            text: "Draft",
          },
          DRAFT: {
            color: "default",
            text: "Draft",
          },
          pending_quote: {
            color: "blue",
            text: "Pending Quote",
          },
          PENDING_QUOTE: {
            color: "blue",
            text: "Pending Quote",
          },
          voting: {
            color: "orange",
            text: "Voting",
          },
          VOTING: {
            color: "orange",
            text: "Voting",
          },
          approved: {
            color: "green",
            text: "Approved",
          },
          APPROVED: {
            color: "green",
            text: "Approved",
          },
          rejected: {
            color: "red",
            text: "Rejected",
          },
          REJECTED: {
            color: "red",
            text: "Rejected",
          },
          in_progress: {
            color: "processing",
            text: "In Progress",
          },
          IN_PROGRESS: {
            color: "processing",
            text: "In Progress",
          },
          completed: {
            color: "success",
            text: "Completed",
          },
          COMPLETED: {
            color: "success",
            text: "Completed",
          },
        };
        const statusInfo = statusMap[status] || {
          color: "default",
          text: status,
        };
        return (
          <Tag color={statusInfo.color} style={{ fontSize: "11px", margin: 0 }}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_, record) => {
        const status = record.status?.toLowerCase();
        
        // Technician can set schedule when status is draft or pending_quote
        const canSetSchedule = ['draft', 'pending_quote'].includes(status);
        
        // Technician can set estimate when status is pending_quote (after setting schedule)
        const canSetEstimate = status === 'pending_quote';
        
        return (
          <Space size="small">
            <Button
              type={canSetSchedule ? "primary" : "default"}
              icon={<CalendarOutlined />}
              size="small"
              onClick={() => handleOpenScheduleModal(record)}
              disabled={!canSetSchedule && status !== 'draft'}
              style={{ fontSize: "12px", padding: "0 8px" }}
              title={canSetSchedule ? "Set inspection schedule" : "Can only set schedule when in Draft status"}
            >
              Schedule
            </Button>
            <Button
              type={canSetEstimate ? "primary" : "default"}
              icon={<DollarOutlined />}
              size="small"
              onClick={() => handleOpenEstimateModal(record)}
              disabled={!canSetEstimate}
              style={{ fontSize: "12px", padding: "0 8px" }}
              title={canSetEstimate ? "Set quote" : "Can only quote after setting schedule"}
            >
              Quote
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <TechnicianSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="review-contracts"
      />

      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header
          style={{
            padding: 0,
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Title level={3} style={{ margin: "16px 24px" }}>
            Review Service Requests
          </Title>
        </Header>

        <Content style={{ margin: "24px 16px" }}>
          <Card>
            <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                  marginBottom: "12px",
              }}
            >
                <Title level={5} style={{ margin: 0 }}>
                  Service Requests
                </Title>
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() => loadContracts()}
                >
                  Refresh
                </Button>
              </div>

              {(isAdmin || isTechnician) && (
                <Space wrap>
                  <Space>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>
                      Status:
                    </span>
                    <Select
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      style={{ width: 150 }}
                      size="small"
                      options={[
                        { value: "ALL", label: "All" },
                        { value: "draft", label: "Draft" },
                        { value: "pending_quote", label: "Pending Quote" },
                        { value: "voting", label: "Voting" },
                        { value: "approved", label: "Approved" },
                        { value: "rejected", label: "Rejected" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
                  </Space>

                  <Space>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>
                      Service Type:
                    </span>
                    <Select
                      value={selectedType}
                      onChange={handleTypeChange}
                      style={{ width: 150 }}
                      size="small"
                      options={[
                        { value: "ALL", label: "All" },
                        { value: "MAINTENANCE", label: "Maintenance" },
                        { value: "REPAIR", label: "Repair" },
                        { value: "INSPECTION", label: "Inspection" },
                        { value: "CLEANING", label: "Cleaning" },
                        { value: "UPGRADE", label: "Upgrade" },
                      ]}
                    />
                  </Space>

                  <Space>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>
                      Sort:
                    </span>
                    <Select
                      value={sortOrder}
                      onChange={handleSortOrderChange}
                      style={{ width: 150 }}
                      size="small"
                      options={[
                        { value: "DESC", label: "Newest" },
                        { value: "ASC", label: "Oldest" },
                      ]}
                    />
                  </Space>
                </Space>
              )}
            </div>
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={contracts}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total: ${total} requests`,
                }}
                locale={{
                  emptyText: "No service requests",
                }}
                size="small"
              />
            </Spin>
          </Card>
        </Content>
      </Layout>

      {/* Schedule Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Update Inspection Schedule</span>
          </Space>
        }
        open={scheduleModalVisible}
        onCancel={() => {
          setScheduleModalVisible(false);
          scheduleForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={scheduleForm}
          layout="vertical"
          onFinish={handleScheduleSubmit}
        >
          <Form.Item
            name="inspectionScheduledAt"
            label="Inspection Time"
            rules={[
              { required: true, message: "Please select inspection time" },
            ]}
          >
            <DatePicker
              showTime
              format="MM/DD/YYYY HH:mm"
              placeholder="Select date and time"
              style={{ width: "100%" }}
              disabledDate={(current) => {
                // Disable dates before today
                return current && current < dayjs().startOf("day");
              }}
            />
          </Form.Item>

          <Form.Item name="inspectionNotes" label="Inspection Notes">
            <TextArea
              rows={4}
              placeholder="Enter notes about inspection schedule (optional)..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setScheduleModalVisible(false);
                  scheduleForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={scheduleLoading}
                icon={<CalendarOutlined />}
              >
                Update Schedule
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Estimate Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>Update Cost Estimate</span>
          </Space>
        }
        open={estimateModalVisible}
        onCancel={() => {
          setEstimateModalVisible(false);
          estimateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={estimateForm}
          layout="vertical"
          onFinish={handleEstimateSubmit}
        >
          <Form.Item
            name="costEstimate"
            label="Cost Estimate (VNĐ)"
            rules={[
              { required: true, message: "Please enter cost estimate" },
              {
                type: "number",
                min: 0,
                message: "Cost must be greater than or equal to 0",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter cost estimate"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              min={0}
              step={10000}
            />
          </Form.Item>

          <Form.Item name="estimateNotes" label="Cost Notes">
            <TextArea
              rows={4}
              placeholder="Enter notes about cost estimate (optional)..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setEstimateModalVisible(false);
                  estimateForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={estimateLoading}
                icon={<DollarOutlined />}
              >
                Update Cost
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ReviewService;
