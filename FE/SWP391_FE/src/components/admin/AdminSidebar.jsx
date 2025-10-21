import React from "react";
import { Layout, Menu, Button } from "antd";
import {
  PieChartOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  PlusOutlined,
  LogoutOutlined,
  CarOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Sider } = Layout;

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
      {
        key: "view-contracts",
        icon: <FileTextOutlined />,
        label: <Link to="/view-mycontract">View Contracts</Link>,
      },
    ],
  },
  {
    key: "group-management",
    icon: <TeamOutlined />,
    label: "Group Management",
    children: [
      {
        key: "manage-groups",
        icon: <TeamOutlined />,
        label: <Link to="/admin/manage-group">Manage Groups</Link>,
      },
      {
        key: "view-groups",
        icon: <TeamOutlined />,
        label: <Link to="/view-myGroup">View Groups</Link>,
      },
    ],
  },
  {
    key: "vehicle-management",
    icon: <CarOutlined />,
    label: "Vehicle Management",
    children: [
      {
        key: "manage-vehicles",
        icon: <CarOutlined />,
        label: <Link to="/admin/manage-vehicle">Manage Vehicles</Link>,
      },
    ],
  },
  {
    key: "service-management",
    icon: <SettingOutlined />,
    label: "Service Management",
    children: [
      {
        key: "manage-services",
        icon: <SettingOutlined />,
        label: <Link to="/admin/manage-service">Manage Services</Link>,
      },
    ],
  },
];

const AdminSidebar = ({ collapsed, onCollapse, selectedKey }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa toàn bộ dữ liệu authentication từ localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("password");

    // Xóa toàn bộ sessionStorage
    sessionStorage.clear();

    // Chuyển hướng về trang login
    navigate("/login");
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={280}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="demo-logo-vertical" style={{ height: 32, margin: 16 }} />
      <Menu
        theme="dark"
        selectedKeys={[selectedKey]}
        mode="inline"
        items={items}
        style={{ marginBottom: 60 }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: collapsed ? "16px 8px" : "16px",
          background: "#001529",
          marginBottom: 50,
        }}
      >
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          size="large"
        >
          {!collapsed && "Logout"}
        </Button>
      </div>
    </Sider>
  );
};

export default AdminSidebar;
