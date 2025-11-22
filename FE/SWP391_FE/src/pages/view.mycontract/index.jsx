import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  message,
  Spin,
  Empty,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
// import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useAuth } from "../../components/hooks/useAuth";
import "./view-contract.css";

const { Title, Paragraph } = Typography;

const MyContracts = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCoOwner, isAdmin, isStaff, userData } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xem hợp đồng của bạn");
      navigate("/login");
      return;
    }

    if (!isCoOwner && !isAdmin && !isStaff) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/");
      return;
    }

    loadContracts();
  }, [isAuthenticated, isCoOwner, isAdmin, isStaff, navigate]);

  // Load contracts
  const loadContracts = async () => {
    console.log("loadContracts function called");
    try {
      setLoading(true);
      console.log("Making API call to /contracts/my");
      const response = await api.get("/contracts/my");
      console.log("Contracts API response:", response.data);

      // Handle different response structures
      let contractsData = [];
      if (response.data && Array.isArray(response.data.data)) {
        contractsData = response.data.data;
        console.log("Using response.data.data");
      } else if (Array.isArray(response.data)) {
        contractsData = response.data;
        console.log("Using response.data");
      } else if (
        response.data &&
        response.data.contracts &&
        Array.isArray(response.data.contracts)
      ) {
        contractsData = response.data.contracts;
        console.log("Using response.data.contracts");
      } else {
        console.log("Unexpected response structure:", response.data);
        contractsData = [];
      }

      console.log("Processed contracts data:", contractsData);
      setContracts(contractsData);
    } catch (error) {
      console.error("Error loading contracts:", error);
      message.error("Không thể tải danh sách hợp đồng");
      setContracts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle preview contract
  const handlePreview = async (contractId) => {
    try {
      setPreviewLoading(true);
      console.log("Fetching preview for contract:", contractId);
      const response = await api.get(`/contracts/${contractId}/preview`);
      console.log("Preview API response:", response.data);

      // Find the contract from the list to get its details
      const contract = contracts.find((c) => c.id === contractId);

      // Set the contract with HTML content
      setSelectedContract({
        ...contract,
        content: response.data, // API returns HTML string directly
      });
      setPreviewModalVisible(true);
    } catch (error) {
      console.error("Error loading contract preview:", error);
      message.error("Không thể tải thông tin hợp đồng");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Check if contract can be signed - only show sign button for truly unsigned contracts
  const canSignContract = (contract) => {
    const status = contract.status || contract.isSigned;

    // If status is boolean
    if (typeof status === "boolean") {
      return !status; // Can sign if not signed
    }

    // If status is string - be more specific about what can be signed
    if (typeof status === "string") {
      const statusLower = status.toLowerCase().trim();

      // Only allow signing for these specific "unsigned" statuses
      const unsignedStatuses = [
        "unsigned",
        "chưa ký",
        "draft",
        "nháp",
        "not_signed",
        "unconfirmed",
        "signing",
        "đang ký",
      ];

      // Explicitly deny signing for these "signed" statuses
      const signedStatuses = [
        "signed",
        "đã ký",
        "confirmed",
        "xác nhận",
        "completed",
        "hoàn thành",
        "approved",
        "đã duyệt",
        "active",
        "hiệu lực",
      ];

      // If it's explicitly signed, don't show sign button
      if (signedStatuses.includes(statusLower)) {
        return false;
      }

      // If it's explicitly unsigned, show sign button
      if (unsignedStatuses.includes(statusLower)) {
        return true;
      }

      // For pending/waiting statuses, don't show sign button (these are usually in review)
      const pendingStatuses = [
        "pending",
        "chờ ký",
        "waiting",
        "chờ xác nhận",
        "pending_review",
        "chờ duyệt",
        "in_review",
        "đang xem xét",
      ];

      if (pendingStatuses.includes(statusLower)) {
        return false;
      }

      // For unknown status, be conservative and don't show sign button
      return false;
    }

    // Default: don't show sign button if no status or unknown status
    return false;
  };

  // Handle sign contract
  const handleSign = async (contractId) => {
    try {
      // Find the contract details
      const contract = contracts.find((c) => c.id === contractId);
      const userEmail = userData?.email || "";

      // Navigate to sign contract page with full contract info
      navigate(`/sign-econtract/${contractId}`, {
        state: {
          email: userEmail,
          contract: contract,
          title: contract?.title || "Hợp đồng",
          createdAt: contract?.createdAt,
          effectiveFrom: contract?.effectiveFrom,
          expiresAt: contract?.expiresAt,
          status: contract?.status,
          description: contract?.description,
        },
      });
    } catch (error) {
      console.error("Error navigating to sign page:", error);
      message.error("Không thể chuyển đến trang ký hợp đồng");
    }
  };

  // Get status tag - improved logic to handle different status formats
  const getStatusTag = (contract) => {
    // Handle different possible status fields and formats
    const status = contract.status || contract.isSigned;

    // If status is boolean
    if (typeof status === "boolean") {
      return status ? (
        <Tag color="green">Đã ký</Tag>
      ) : (
        <Tag color="orange">Chưa ký</Tag>
      );
    }

    // If status is string
    if (typeof status === "string") {
      const statusLower = status.toLowerCase();
      switch (statusLower) {
        default:
          return <Tag color="blue">{status}</Tag>;
      }
    }

    // Default fallback
    return <Tag color="orange">UNSIGNED</Tag>;
  };

  // Handle back navigation based on role
  const handleBack = () => {
    if (isStaff) {
      navigate("/staff/review-econtract");
    } else if (isAdmin) {
      navigate("/admin/dashboard");
    } else if (isCoOwner) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày hiệu lực",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(record.id)}
            loading={previewLoading}
          >
            Xem
          </Button>
          {canSignContract(record) && (
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleSign(record.id)}
            >
              Ký
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="view-contract-page">
      <div className="view-contract-content">
        <div className="view-contract-inner">
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  style={{ marginRight: "12px" }}
                >
                  Quay lại
                </Button>
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    Hợp đồng của tôi
                  </Title>
                  <Paragraph style={{ margin: 0 }}>
                    Danh sách tất cả các hợp đồng mà bạn tham gia
                  </Paragraph>
                </div>
              </div>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={() => loadContracts()}
                loading={loading}
              >
                Làm mới
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={contracts}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} trong ${total} hợp đồng`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description="Bạn chưa có hợp đồng nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Card>

          {/* Preview Modal */}
          <Modal
            title={
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <EyeOutlined />
                <span>Xem trước hợp đồng</span>
              </div>
            }
            open={previewModalVisible}
            onCancel={() => setPreviewModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setPreviewModalVisible(false)}>
                Đóng
              </Button>,
            ]}
            width={1000}
            style={{ top: 20 }}
          >
            {previewLoading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
              </div>
            ) : selectedContract ? (
              <div>
                {selectedContract.content && (
                  <div
                    className="ant-typography"
                    style={{
                      border: "1px solid #d9d9d9",
                      padding: "24px",
                      borderRadius: "6px",
                      backgroundColor: "#fafafa",
                      maxHeight: "600px",
                      overflowY: "auto",
                      lineHeight: "1.6",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: selectedContract.content,
                    }}
                  />
                )}
              </div>
            ) : (
              <div>Không có dữ liệu</div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default MyContracts;
