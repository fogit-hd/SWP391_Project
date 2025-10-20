import React, { useState } from "react";
import {
  UserOutlined,
  FileOutlined,
  PlusOutlined,
  UsergroupAddOutlined,
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

  const handleManageAccount = () => {
    navigate("/admin/manage-account");
  };

  const handleViewTemplate = () => {
    navigate("/admin/manage-contract");
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
