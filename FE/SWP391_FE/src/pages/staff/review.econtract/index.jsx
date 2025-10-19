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
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import { toast } from "react-toastify";
import { useAuth } from "../../../hooks/useAuth";

const { Header, Content, Sider } = Layout;
const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ReviewEContract = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedContractContent, setSelectedContractContent] = useState("");
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }
    
    loadContracts();
  }, [isAuthenticated, navigate]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/contracts");

      let allContracts = [];
      if (response.data && Array.isArray(response.data.data)) {
        allContracts = response.data.data;
      } else if (Array.isArray(response.data)) {
        allContracts = response.data;
      } else if (response.data?.contracts) {
        allContracts = response.data.contracts;
      }

      const pendingContracts = allContracts.filter(
        (contract) => contract.status === "PENDING_REVIEW"
      );

      setContracts(pendingContracts);
    } catch (error) {
      console.error("Error:", error);
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
      toast.success(`Hợp đồng đã được ${values.approve ? "duyệt" : "từ chối"}!`);
      
      setReviewModalVisible(false);
      form.resetFields();
      loadContracts();
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
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày hiệu lực",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      width: 150,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: () => <Tag color="blue">Chờ duyệt</Tag>,
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
      <Sider width={200} theme="light">
        <div style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            block
          >
            Về trang chủ
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{ padding: 0, background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
          <Title level={3} style={{ margin: "16px 24px" }}>
            Review E-Contracts
          </Title>
        </Header>

        <Content style={{ margin: "24px 16px" }}>
          <Card>
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
                  emptyText: "Không có hợp đồng nào để duyệt",
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
              <Button
                type="primary"
                htmlType="submit"
                loading={reviewLoading}
              >
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
