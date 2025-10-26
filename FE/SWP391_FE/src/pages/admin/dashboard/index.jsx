import React, { useState } from "react";
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
} from "antd";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/admin/AdminSidebar";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
