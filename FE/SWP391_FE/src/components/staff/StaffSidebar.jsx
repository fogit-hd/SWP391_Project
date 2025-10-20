import React from "react";
import { Layout, Menu, Button } from "antd";
import {
  PieChartOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Sider } = Layout;

const items = [
  {
    key: "dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/staff/dashboard">Dashboard</Link>,
  },
  {
    key: "contract-review",
    icon: <FileTextOutlined />,
    label: "Contract Review",
    children: [
      {
        key: "review-contracts",
        icon: <EyeOutlined />,
        label: <Link to="/staff/review-contract">Review Contracts</Link>,
      },
    ],
  },
  {
    key: "contract-status",
    icon: <CheckCircleOutlined />,
    label: "Contract Status",
    children: [
      {
        key: "pending-contracts",
        icon: <ClockCircleOutlined />,
        label: <Link to="/staff/pending-contracts">Pending Contracts</Link>,
      },
      {
        key: "approved-contracts",
        icon: <CheckCircleOutlined />,
        label: <Link to="/staff/approved-contracts">Approved Contracts</Link>,
      },
    ],
  },
];

const StaffSidebar = ({ collapsed, onCollapse, selectedKey }) => {
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

export default StaffSidebar;
