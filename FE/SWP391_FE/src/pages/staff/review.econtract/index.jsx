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
  Statistic,
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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import StaffSidebar from "../../../components/staff/StaffSidebar";

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ReviewEContract = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isStaff, roleId } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [allContracts, setAllContracts] = useState([]); // Store all contracts
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedContractContent, setSelectedContractContent] = useState("");
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(
    isAdmin ? "ALL" : "PENDING_REVIEW"
  ); // Filter status - Admin sees all, Staff sees only PENDING_REVIEW
  const [form] = Form.useForm();
  const [contractStatistics, setContractStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("DESC"); // DESC = newest first, ASC = oldest first

  // Fetch Contract Statistics (Admin only)
  const fetchContractStatistics = async () => {
    if (!isAdmin) return; // Only fetch for admin

    setStatisticsLoading(true);
    try {
      const response = await api.get("/Statistic/contract-statistics");
      if (response.data?.isSuccess) {
        setContractStatistics(response.data.data);
      } else {
        console.error(
          "Failed to fetch contract statistics:",
          response.data?.message
        );
      }
    } catch (err) {
      console.error("Error fetching contract statistics:", err);
    } finally {
      setStatisticsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }

    loadContracts();
    if (isAdmin) {
      fetchContractStatistics();
    }
  }, [isAuthenticated, navigate, isAdmin]);

  // Filter and sort contracts by status and date
  const filterAndSortContracts = (contractsList, status, sortOrder) => {
    let filtered = [];

    // Staff can only see PENDING_REVIEW contracts
    if (isStaff) {
      const pendingStatuses = ["PENDING_REVIEW", "pending_review"];

      filtered = contractsList.filter((contract) => {
        const contractStatus =
          contract.status || contract.state || contract.contractStatus;
        return pendingStatuses.includes(contractStatus);
      });

      console.log(
        "📋 Staff - Showing only PENDING_REVIEW contracts:",
        filtered.length
      );
    } else {
      // Admin (roleId = 1) can see all or filter by status
      if (status === "ALL") {
        filtered = [...contractsList];
        console.log("📋 Admin - Showing ALL contracts:", filtered.length);
      } else {
        filtered = contractsList.filter((contract) => {
          const contractStatus =
            contract.status || contract.state || contract.contractStatus;
          return contractStatus === status;
        });
        console.log(`📋 Admin - Filtered by ${status}:`, filtered.length);
      }
    }

    // Sort by createdAt
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
    });

    setContracts(filtered);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterAndSortContracts(allContracts, status, sortOrder);
  };

  // Handle sort order change
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    filterAndSortContracts(allContracts, selectedStatus, order);
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      console.log("📞 Calling API: GET /contracts");
      console.log("🔍 Current roleId:", roleId);
      console.log("🔍 isStaff:", isStaff);
      console.log("🔍 isAdmin:", isAdmin);

      const response = await api.get("/contracts");
      console.log("📦 Full response:", response);
      console.log("📦 Response.data:", response.data);

      let allContractsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        allContractsData = response.data.data;
        console.log("✅ Using response.data.data");
      } else if (Array.isArray(response.data)) {
        allContractsData = response.data;
        console.log("✅ Using response.data");
      } else if (response.data?.contracts) {
        allContractsData = response.data.contracts;
        console.log("✅ Using response.data.contracts");
      }

      console.log("📊 Total contracts from API:", allContractsData.length);

      // Debug: Log all contract statuses with detailed info
      console.log(
        "🔍 All contract statuses:",
        allContractsData.map((c) => ({
          id: c.id,
          status: c.status,
          state: c.state,
          contractStatus: c.contractStatus,
          title: c.title,
          allFields: Object.keys(c),
        }))
      );

      // Store all contracts
      setAllContracts(allContractsData);

      // Apply filter based on role and selected status
      if (isStaff) {
        // Staff can only see PENDING_REVIEW contracts
        console.log("👤 Staff role detected - filtering PENDING_REVIEW only");

        // Try different possible status values for contracts that need staff review
        const pendingStatuses = ["PENDING_REVIEW", "pending_review"];

        const pendingContracts = allContractsData.filter((contract) => {
          const status =
            contract.status || contract.state || contract.contractStatus;
          return pendingStatuses.includes(status);
        });

        console.log(
          "🔍 PENDING_REVIEW contracts found:",
          pendingContracts.length
        );
        console.log("🔍 PENDING_REVIEW contracts:", pendingContracts);

        // Sort by createdAt
        pendingContracts.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
        });

        setContracts(pendingContracts);
      } else {
        // Admin can see all or filter by selected status
        console.log(
          "👑 Admin role detected - applying selected filter:",
          selectedStatus
        );
        filterAndSortContracts(allContractsData, selectedStatus, sortOrder);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      message.error("Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (contractId) => {
    try {
      setPreviewLoading(true);
      const response = await api.get(`/contracts/${contractId}/preview`);
      setSelectedContractContent(response.data);
      setPreviewModalVisible(true);
    } catch (error) {
      console.error("Error:", error);
      message.error("Không thể tải hợp đồng");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleReviewSubmit = async (values) => {
    try {
      setReviewLoading(true);
      const payload = {
        approve: values.approve,
        note: values.note || "",
      };

      await api.post(`/contracts/${selectedContractId}/review`, payload);
      toast.success(
        `Hợp đồng đã được ${values.approve ? "duyệt" : "từ chối"}!`
      );

      setReviewModalVisible(false);
      form.resetFields();
      loadContracts();
      if (isAdmin) {
        fetchContractStatistics();
      }
    } catch (error) {
      console.error("Error:", error);
      message.error("Không thể gửi đánh giá");
    } finally {
      setReviewLoading(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => id?.substring(0, 8) + "...",
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => {
        if (!date) return "N/A";
        try {
          return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMap = {
          PENDING_REVIEW: {
            color: "blue",
            text: "Chờ duyệt",
            icon: <ClockCircleOutlined />,
          },
          APPROVED: {
            color: "green",
            text: "Đã duyệt",
            icon: <CheckCircleOutlined />,
          },
          REJECTED: {
            color: "red",
            text: "Từ chối",
            icon: <CloseCircleOutlined />,
          },
        };
        const statusInfo = statusMap[status] || {
          color: "default",
          text: status,
          icon: null,
        };
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(record.id)}
          >
            Xem
          </Button>
          <Button
            type="default"
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => {
              setSelectedContractId(record.id);
              setReviewModalVisible(true);
            }}
          >
            Review
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <StaffSidebar
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
            Review E-Contracts
          </Title>
        </Header>

        <Content style={{ margin: "24px 16px" }}>
          {/* Contract Statistics Section (Admin only) */}
          {isAdmin && (
            <Card
              title="Thống Kê Hợp Đồng"
              style={{ marginBottom: 24 }}
              loading={statisticsLoading}
            >
              <Row
                gutter={[12, 12]}
                style={{ display: "flex", flexWrap: "nowrap" }}
              >
                <Col flex="1" style={{ minWidth: 0 }}>
                  <Card size="small">
                    <Statistic
                      title="Tổng Số Hợp Đồng"
                      value={contractStatistics?.totalContracts || 0}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: "#1890ff", fontSize: "20px" }}
                    />
                  </Card>
                </Col>
                {(() => {
                  // Define all statuses that should always be displayed
                  const allStatuses = [
                    {
                      status: "PENDING_REVIEW",
                      label: "Chờ Duyệt",
                      color: "#1890ff",
                    },
                    { status: "APPROVED", label: "Đã Duyệt", color: "#52c41a" },
                    { status: "REJECTED", label: "Từ Chối", color: "#ff4d4f" },
                  ];

                  // Create a map from API response
                  const statusMap = new Map();
                  contractStatistics?.byStatus?.forEach((statusStat) => {
                    statusMap.set(statusStat.status, statusStat.count || 0);
                  });

                  // Render all statuses, using count from API or 0 if not present
                  return allStatuses.map((statusInfo, index) => {
                    const count = statusMap.get(statusInfo.status) || 0;
                    return (
                      <Col
                        flex="1"
                        key={statusInfo.status}
                        style={{ minWidth: 0 }}
                      >
                        <Card size="small">
                          <Statistic
                            title={statusInfo.label}
                            value={count}
                            valueStyle={{
                              color: statusInfo.color,
                              fontSize: "20px",
                            }}
                          />
                        </Card>
                      </Col>
                    );
                  });
                })()}
              </Row>
            </Card>
          )}

          <Card>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                Danh sách hợp đồng
              </Title>
              {isAdmin && (
                <Space>
                  <span>Lọc theo trạng thái:</span>
                  <Select
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    style={{ width: 200 }}
                    options={[
                      { value: "ALL", label: "Tất cả" },
                      { value: "PENDING_REVIEW", label: "Chờ duyệt" },
                      { value: "APPROVED", label: "Đã duyệt" },
                      { value: "REJECTED", label: "Từ chối" },
                    ]}
                  />
                  <span>Sắp xếp:</span>
                  <Select
                    value={sortOrder}
                    onChange={handleSortOrderChange}
                    style={{ width: 180 }}
                    options={[
                      { value: "DESC", label: "Mới nhất trước" },
                      { value: "ASC", label: "Cũ nhất trước" },
                    ]}
                  />
                </Space>
              )}
              {isStaff && (
                <Space>
                  <Tag color="orange" icon={<ClockCircleOutlined />}>
                    Danh sách hợp đồng đang duyệt hoặc chờ duyệt
                  </Tag>
                  <span>Sắp xếp:</span>
                  <Select
                    value={sortOrder}
                    onChange={handleSortOrderChange}
                    style={{ width: 180 }}
                    options={[
                      { value: "DESC", label: "Mới nhất trước" },
                      { value: "ASC", label: "Cũ nhất trước" },
                    ]}
                  />
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
                  showTotal: (total) => `Tổng: ${total} hợp đồng`,
                }}
                locale={{
                  emptyText: "Không có hợp đồng nào",
                }}
              />
            </Spin>
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Xem trước hợp đồng"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={1000}
      >
        <Spin spinning={previewLoading}>
          {selectedContractContent ? (
            <div
              className="ant-typography"
              style={{
                border: "1px solid #d9d9d9",
                padding: "24px",
                borderRadius: "6px",
                backgroundColor: "#fafafa",
                maxHeight: "600px",
                overflowY: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: selectedContractContent }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Paragraph>Không có nội dung</Paragraph>
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="Review Contract"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item
            name="approve"
            label="Quyết định"
            rules={[{ required: true, message: "Vui lòng chọn quyết định" }]}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  block
                  onClick={() => form.setFieldsValue({ approve: true })}
                  style={{ height: "40px" }}
                >
                  Duyệt
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  block
                  onClick={() => form.setFieldsValue({ approve: false })}
                  style={{ height: "40px" }}
                >
                  Từ chối
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú (tùy chọn)">
            <TextArea rows={4} placeholder="Nhập ghi chú về quyết định..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setReviewModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={reviewLoading}>
                Gửi Review
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ReviewEContract;
