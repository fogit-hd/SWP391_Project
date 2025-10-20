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
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useAuth } from "../../components/hooks/useAuth";

const { Title, Paragraph } = Typography;

const MyContracts = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCoOwner, user } = useAuth();
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

    if (!isCoOwner) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/");
      return;
    }

    loadContracts();
  }, [isAuthenticated, isCoOwner, navigate]);

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
    if (typeof status === 'boolean') {
      return !status; // Can sign if not signed
    }
    
    // If status is string - be more specific about what can be signed
    if (typeof status === 'string') {
      const statusLower = status.toLowerCase().trim();
      
      // Only allow signing for these specific "unsigned" statuses
      const unsignedStatuses = [
        'unsigned', 
        'chưa ký', 
        'draft', 
        'nháp',
        'not_signed',
        'unconfirmed',
        'signing',
        'đang ký'
      ];
      
      // Explicitly deny signing for these "signed" statuses
      const signedStatuses = [
        'signed',
        'đã ký',
        'confirmed', 
        'xác nhận',
        'completed',
        'hoàn thành',
        'approved',
        'đã duyệt',
        'active',
        'hiệu lực'
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
        'pending',
        'chờ ký',
        'waiting',
        'chờ xác nhận',
        'pending_review',
        'chờ duyệt',
        'in_review',
        'đang xem xét'
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
      // Send OTP first
      await api.post(`/contracts/${contractId}/send-otp`);
      message.success("Mã OTP đã được gửi đến email của bạn");
      // Navigate to verify OTP page
      navigate(`/verify-contract-otp/${contractId}`);
    } catch (error) {
      console.error("Error sending OTP:", error);
      message.error("Không thể gửi mã OTP");
    }
  };

  // Get status tag - improved logic to handle different status formats
  const getStatusTag = (contract) => {
    // Handle different possible status fields and formats
    const status = contract.status || contract.isSigned;
    
    // If status is boolean
    if (typeof status === 'boolean') {
      return status ? <Tag color="green">Đã ký</Tag> : <Tag color="orange">Chưa ký</Tag>;
    }
    
    // If status is string
    if (typeof status === 'string') {
      const statusLower = status.toLowerCase();
      switch (statusLower) {
        case 'signed':
        case 'đã ký':
        case 'confirmed':
        case 'xác nhận':
        case 'completed':
        case 'hoàn thành':
          return <Tag color="green">Đã ký</Tag>;
        case 'pending':
        case 'chờ ký':
        case 'waiting':
        case 'chờ xác nhận':
          return <Tag color="orange">Chờ ký</Tag>;
        case 'signing':
        case 'đang ký':
          return <Tag color="blue">Đang ký</Tag>;
        case 'unsigned':
        case 'chưa ký':
        case 'draft':
        case 'nháp':
          return <Tag color="red">Chưa ký</Tag>;
        case 'expired':
        case 'hết hạn':
          return <Tag color="gray">Hết hạn</Tag>;
        default:
          return <Tag color="blue">{status}</Tag>;
      }
    }
    
    // Default fallback
    return <Tag color="orange">Chưa ký</Tag>;
  };

  // Table columns
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
    <div style={{ padding: "24px" }}>
      <Card>
        <Title level={2}>Hợp đồng của tôi</Title>
        <Paragraph>Danh sách tất cả các hợp đồng mà bạn tham gia</Paragraph>

        <Table
          columns={columns}
          dataSource={contracts}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} hợp đồng`,
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                dangerouslySetInnerHTML={{ __html: selectedContract.content }}
              />
            )}
          </div>
        ) : (
          <div>Không có dữ liệu</div>
        )}
      </Modal>
    </div>
  );
};

export default MyContracts;
