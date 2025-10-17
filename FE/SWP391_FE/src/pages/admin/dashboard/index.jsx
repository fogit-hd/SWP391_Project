import React, { useState } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  EditOutlined,
  CodeOutlined,
  SettingOutlined,
  PlusOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Button,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import { Link, useNavigate } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph } = Typography;

const items = [
  {
    key: "dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "user-management",
    icon: <UserOutlined />,
    label: "User Management",
    children: [
      {
        key: "manage-accounts",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/admin/manage-account">Manage Accounts</Link>,
      },
    ],
  },
  {
    key: "contract-management",
    icon: <FileTextOutlined />,
    label: "Contract Management",
    children: [
      {
        key: "manage-templates",
        icon: <PlusOutlined />,
        label: <Link to="/admin/manage-contract">Manage Templates</Link>,
      },
    ],
  },
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleManageAccount = () => {
    navigate("/admin/manage-account");
  };

  const handleViewTemplate = () => {
    navigate("/admin/manage-contract");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
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
                <Col span={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UsergroupAddOutlined />}
                    onClick={handleManageAccount}
                    block
                  >
                    Manage Accounts
                  </Button>
                </Col>
                <Col span={8}>
                  <Button size="large" icon={<UserOutlined />} block>
                    User Settings
                  </Button>
                </Col>
                <Col span={8}>
                  <Button size="large" icon={<FileOutlined />} block>
                    Reports
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Contract Management Section */}
            <Card title="Contract Management">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleViewTemplate}
                    block
                    style={{ height: 60 }}
                  >
                    View templates
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
