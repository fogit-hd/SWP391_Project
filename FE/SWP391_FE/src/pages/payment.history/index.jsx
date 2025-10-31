import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import "./payment-history.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PaymentHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchPaymentHistory();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterData();
  }, [paymentHistory, statusFilter, dateRange]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/invoice-payments/history/my");
      const data = response.data?.data || response.data || [];
      setPaymentHistory(data);
      console.log("Payment history:", data);
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      // Handle different error scenarios
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        // Show error but don't crash the page
        setPaymentHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...paymentHistory];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((item) => {
        const paymentDate = dayjs(item.paidAt);
        return paymentDate.isBetween(dateRange[0], dateRange[1], "day", "[]");
      });
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      PAID: "success",
      PENDING: "warning",
      FAILED: "error",
      CANCELLED: "default",
      REFUNDED: "processing",
    };
    return statusColors[status] || "default";
  };

  const calculateStats = () => {
    const total = filteredData.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const paidAmount = filteredData
      .filter((item) => item.status === "PAID")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      totalTransactions: filteredData.length,
      totalAmount: total,
      paidAmount: paidAmount,
    };
  };

  const stats = calculateStats();

  const columns = [
    {
      title: "Order Code",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (text) => <Text code>{text || "N/A"}</Text>,
    },
    {
      title: "Payment Date",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A"),
      sorter: (a, b) => dayjs(a.paidAt).unix() - dayjs(b.paidAt).unix(),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Text strong style={{ color: "#1890ff" }}>
          {amount?.toLocaleString() || "0"} VND
        </Text>
      ),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "UNKNOWN"}</Tag>
      ),
      filters: [
        { text: "Paid", value: "PAID" },
        { text: "Pending", value: "PENDING" },
        { text: "Failed", value: "FAILED" },
        { text: "Cancelled", value: "CANCELLED" },
        { text: "Refunded", value: "REFUNDED" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Payment Method",
      dataIndex: "method",
      key: "method",
      render: (method) => method || "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc) => (
        <Text ellipsis style={{ maxWidth: 200 }}>
          {desc || "No description"}
        </Text>
      ),
    },
  ];

  return (
    <div className="payment-history-page">
      <div className="payment-history-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          className="back-button"
        >
          Back to Home
        </Button>
        <div className="header-content">
          <FileTextOutlined className="header-icon" />
          <div>
            <Title level={2} className="page-title">
              Payment History
            </Title>
            <Text type="secondary">
              View your payment transactions and invoices
            </Text>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-section">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              suffix={"VNĐ"}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Paid Amount"
              value={stats.paidAmount}
              suffix={"VNĐ"}
              precision={0}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="filters-card">
        <Space wrap>
          <div>
            <Text strong>Status:</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120, marginLeft: 8 }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="PAID">Paid</Select.Option>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
              <Select.Option value="REFUNDED">Refunded</Select.Option>
            </Select>
          </div>

          <div>
            <Text strong>Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ marginLeft: 8 }}
              placeholder={["Start Date", "End Date"]}
            />
          </div>

          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setStatusFilter("all");
              setDateRange(null);
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Payment History Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey={(record) => record.orderCode || record.id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`,
          }}
          locale={{
            emptyText: loading ? <Spin /> : "No payment history found",
          }}
        />
      </Card>
    </div>
  );
};

export default PaymentHistory;
