import React, { useState } from "react";
import {
  Layout,
  theme,
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Typography,
  Statistic,
  Spin,
  message,
  Table,
  Space,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import dayjs from "dayjs";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import api from "../../../config/axios";
import { toast } from "react-toastify";

const { Content } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const ManageStatistic = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  /**
   * Fetch revenue statistics from API
   */
  const fetchStatistics = async () => {
    console.log("=== FETCH STATISTICS START ===");
    console.log("Loading state:", loading);
    console.log("Date range:", dateRange);

    // Prevent multiple simultaneous calls
    if (loading) {
      console.log("Already loading, skipping...");
      return;
    }

    if (!dateRange || dateRange.length !== 2) {
      console.error("Date range validation failed:", dateRange);
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }

    setLoading(true);
    try {
      console.log("Formatting datetime...");
      console.log("DateRange[0] type:", typeof dateRange[0], dateRange[0]);
      console.log("DateRange[1] type:", typeof dateRange[1], dateRange[1]);

      // Format datetime for C# backend
      // Backend expects "Unspecified" format (no timezone info) or UTC
      // Form input is "specified", backend will use helper to convert to UTC
      // Format: YYYY-MM-DDTHH:mm:ss.SSS (Unspecified - no timezone)
      const startDate = dayjs(dateRange[0]).format('YYYY-MM-DDTHH:mm:ss.SSS');
      const endDate = dayjs(dateRange[1]).format('YYYY-MM-DDTHH:mm:ss.SSS');

      console.log("Formatted dates:", {
        start: startDate,
        end: endDate
      });

      console.log("Sending API request to /Statistic/Revenue-statistic/admin");
      console.log("Query parameters:", { Start: startDate, End: endDate });

      const response = await api.get("/Statistic/Revenue-statistic/admin", {
        params: {
          Start: startDate,
          End: endDate,
        },
      });

      console.log("API Response received:", response);
      console.log("Response data:", response.data);

      if (response.data?.isSuccess) {
        console.log("Success! Setting statistics:", response.data.data);
        setStatistics(response.data.data);
        toast.success(response.data.message || "Lấy thống kê thành công");
      } else {
        const errorMessage = response.data?.message || "Không thể lấy thống kê";
        console.error("Statistics API returned error:", errorMessage);
        console.error("Full response:", response.data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("=== ERROR FETCHING STATISTICS ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error config:", error.config);
      
      // Show detailed error message
      let errorMessage = "Có lỗi xảy ra khi lấy thống kê";
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi từ server: ${error.response.status} ${error.response.statusText}`;
        console.error("Server error:", errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.";
        console.error("Network error - no response received");
      } else {
        // Something else happened
        errorMessage = error.message || "Có lỗi xảy ra khi lấy thống kê";
        console.error("Unknown error:", errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("=== FETCH STATISTICS END ===");
    }
  };

  /**
   * Prepare data for pie chart
   */
  const preparePieChartData = () => {
    if (!statistics?.technicianRevenue || statistics.technicianRevenue.length === 0) {
      return [];
    }
    return statistics.technicianRevenue.map((item) => ({
      name: item.technicianName,
      value: item.revenue,
    }));
  };

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  /**
   * Table columns for technician revenue
   */
  const technicianColumns = [
    {
      title: "Tên Kỹ Thuật Viên",
      dataIndex: "technicianName",
      key: "technicianName",
    },
    {
      title: "Doanh Thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  const pieChartData = preparePieChartData();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="statistics"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <Title level={2}>Thống Kê Doanh Thu</Title>
            </div>

            {/* Date Range Picker */}
            <Card style={{ marginBottom: 24 }}>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Typography.Text strong style={{ marginRight: 8 }}>
                    Chọn khoảng thời gian:
                  </Typography.Text>
                  <RangePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: 400 }}
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchStatistics}
                  loading={loading}
                  size="large"
                >
                  Lấy Thống Kê
                </Button>
              </Space>
            </Card>

            {/* Statistics Display */}
            {loading && (
              <div style={{ textAlign: "center", padding: 50 }}>
                <Spin size="large" tip="Đang tải thống kê..." />
              </div>
            )}

            {!loading && statistics && (
              <>
                {/* Summary Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Tổng Doanh Thu"
                        value={statistics.totalRevenue}
                        prefix={<DollarOutlined />}
                        formatter={(value) => formatCurrency(value)}
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Đơn Hàng Hoàn Thành"
                        value={statistics.completedOrders}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: "#1890ff" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Xe Đã Phục Vụ"
                        value={statistics.vehiclesServiced}
                        prefix={<CarOutlined />}
                        valueStyle={{ color: "#722ed1" }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Pie Chart and Table */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Phân Bổ Doanh Thu Theo Kỹ Thuật Viên">
                      {pieChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign: "center", padding: 50 }}>
                          <Typography.Text type="secondary">
                            Không có dữ liệu
                          </Typography.Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="Chi Tiết Doanh Thu Kỹ Thuật Viên">
                      <Table
                        columns={technicianColumns}
                        dataSource={statistics.technicianRevenue || []}
                        rowKey="technicianName"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {!loading && !statistics && (
              <Card>
                <div style={{ textAlign: "center", padding: 50 }}>
                  <Typography.Text type="secondary">
                    Vui lòng chọn khoảng thời gian và nhấn "Lấy Thống Kê" để xem
                    dữ liệu
                  </Typography.Text>
                </div>
              </Card>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManageStatistic;

