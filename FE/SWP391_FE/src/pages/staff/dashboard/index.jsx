import React, { useState, useEffect } from "react";
import {
  EyeOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  theme,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Result,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/hooks/useAuth";
import StaffSidebar from "../../../components/staff/StaffSidebar";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const StaffDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { isStaff, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    console.log("[STAFF-DASHBOARD] Role check:", {
      isAuthenticated,
      isStaff,
    });

    if (!isAuthenticated) {
      console.log("[STAFF-DASHBOARD] ✗ Not authenticated - redirecting to login");
      navigate("/login");
      return;
    }

    if (!isStaff) {
      console.log("[STAFF-DASHBOARD] ✗ Not staff role - redirecting to home");
      navigate("/");
      return;
    }

    console.log("[STAFF-DASHBOARD] ✓ Staff access granted");
    setIsLoading(false);
  }, [isAuthenticated, isStaff, navigate]);

  if (isLoading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </Layout>
    );
  }

  if (!isStaff) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You don't have permission to access this page."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Go Home
          </Button>
        }
      />
    );
  }

  const handleReviewContracts = () => {
    navigate("/staff/review-econtract");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <StaffSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="dashboard"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={[{ title: "Home" }, { title: "Dashboard" }]}
          />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <Title level={2}>Staff Dashboard</Title>
              <Paragraph>
                Review và quản lý hợp đồng điện tử của khách hàng một cách hiệu quả.
              </Paragraph>
            </div>

            {/* Contract Review Section */}
            <Card title="Contract Review">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleReviewContracts}
                    block
                    style={{ height: 60 }}
                  >
                    Review Contracts
                  </Button>
                </Col>
              </Row>
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default StaffDashboard;

