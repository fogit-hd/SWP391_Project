import React, { useState, useEffect } from "react";
import {
  UserOutlined,
  FileOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  TeamOutlined,
  CarOutlined,
  SettingOutlined,
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
  Divider,
  Result,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/hooks/useAuth";
import AdminSidebar from "../../../components/admin/AdminSidebar";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    console.log("[ADMIN-DASHBOARD] Role check:", {
      isAuthenticated,
      isAdmin,
    });

    if (!isAuthenticated) {
      console.log("[ADMIN-DASHBOARD] ✗ Not authenticated - redirecting to login");
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      console.log("[ADMIN-DASHBOARD] ✗ Not admin role - redirecting to home");
      navigate("/");
      return;
    }

    console.log("[ADMIN-DASHBOARD] ✓ Admin access granted");
    setIsLoading(false);
  }, [isAuthenticated, isAdmin, navigate]);

  if (isLoading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
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

  // Navigation handlers
  const handleManageAccount = () => {
    navigate("/admin/manage-account");
  };

  const handleManageContract = () => {
    navigate("/admin/manage-contract");
  };

  const handleViewContracts = () => {
    navigate("/view-mycontract");
  };

  const handleReviewEContracts = () => {
    // Admin can access staff pages via ProtectedRoute; navigate to review screen
    navigate("/staff/review-econtract");
  };

  const handleManageGroup = () => {
    navigate("/admin/manage-group");
  };

  const handleViewGroups = () => {
    navigate("/view-myGroup");
  };

  const handleManageVehicle = () => {
    navigate("/admin/manage-vehicle");
  };

  const handleManageService = () => {
    navigate("/admin/manage-service");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
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
              <Title level={2}>Admin Dashboard</Title>
              <Paragraph>
                Manage your application and contract templates from here.
              </Paragraph>
            </div>

            {/* User Management Section */}
            <Card title="User Management" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UsergroupAddOutlined />}
                    onClick={handleManageAccount}
                    block
                    style={{ height: 60 }}
                  >
                    Manage Accounts
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Contract Management Section */}
            <Card title="Contract Management" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleManageContract}
                    block
                    style={{ height: 60 }}
                  >
                    Manage Templates
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleViewContracts}
                    block
                    style={{ height: 60 }}
                  >
                    View Contracts
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    size="large"
                    icon={<FileTextOutlined />}
                    onClick={handleReviewEContracts}
                    block
                    style={{ height: 60 }}
                  >
                    Review E-Contracts
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Group Management Section */}
            <Card title="Group Management" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<TeamOutlined />}
                    onClick={handleManageGroup}
                    block
                    style={{ height: 60 }}
                  >
                    Manage Groups
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleViewGroups}
                    block
                    style={{ height: 60 }}
                  >
                    View Groups
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Vehicle Management Section */}
            <Card title="Vehicle Management" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CarOutlined />}
                    onClick={handleManageVehicle}
                    block
                    style={{ height: 60 }}
                  >
                    Manage Vehicles
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Service Management Section */}
            <Card title="Service Management">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SettingOutlined />}
                    onClick={handleManageService}
                    block
                    style={{ height: 60 }}
                  >
                    Manage Service Centers
                  </Button>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleManageService}
                    block
                    style={{ height: 60 }}
                  >
                    View Service Centers
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

export default Dashboard;
