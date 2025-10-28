import React, { useState, useEffect } from "react";
import { EyeOutlined } from "@ant-design/icons";
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
import TechnicianSidebar from "../../../components/technician/TechnicianSidebar";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const TechnicianDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { isTechnician, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    console.log("[TECHNICIAN-DASHBOARD] Role check:", {
      isAuthenticated,
      isTechnician,
    });

    if (!isAuthenticated) {
      console.log("[TECHNICIAN-DASHBOARD] ✗ Not authenticated - redirecting to login");
      navigate("/login");
      return;
    }

    if (!isTechnician) {
      console.log("[TECHNICIAN-DASHBOARD] ✗ Not technician role - redirecting to home");
      navigate("/");
      return;
    }

    console.log("[TECHNICIAN-DASHBOARD] ✓ Technician access granted");
    setIsLoading(false);
  }, [isAuthenticated, isTechnician, navigate]);

  if (isLoading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </Layout>
    );
  }

  if (!isTechnician) {
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

  const handleReviewService = () => {
    navigate("/technician/review-service");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <TechnicianSidebar
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
              <Title level={2}>Technician Dashboard</Title>
              <Paragraph>Review and manage services from here.</Paragraph>
            </div>

            {/* Service Review Section */}
            <Card title="Service Review">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleReviewService}
                    block
                    style={{ height: 60 }}
                  >
                    Review Service
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

export default TechnicianDashboard;
