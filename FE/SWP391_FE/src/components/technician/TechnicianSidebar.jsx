import React from "react";
import { Layout, Menu, Button } from "antd";
import {
  PieChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  EyeOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Sider } = Layout;

/**
 * Get menu items for Technician Sidebar
 * @param {Function} navigate - Navigation function from useNavigate hook
 * @returns {Array} Menu items configuration
 */
const getMenuItems = (navigate) => [
  {
    key: "dashboard",
    icon: <PieChartOutlined />,
    label: "Dashboard",
    onClick: () => {
      // Smart redirect based on user role
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const roleId = userData?.roleId;

      if (roleId === 1) {
        navigate("/admin/dashboard");
      } else if (roleId === 2) {
        navigate("/staff/dashboard");
      } else if (roleId === 4) {
        navigate("/technician/dashboard");
      } else {
        navigate("/technician/dashboard"); // Default to technician
      }
    },
  },
  {
    key: "service-review",
    icon: <FileTextOutlined />,
    label: "Service Review",
    children: [
      {
        key: "review-services",
        icon: <EyeOutlined />,
        label: <Link to="/technician/review-services">Review Services</Link>,
      },
      {
        key: "service-jobs",
        icon: <ToolOutlined />,
        label: <Link to="/technician/service-jobs">Service Jobs</Link>,
      },
    ],
  },
];

/**
 * Technician Sidebar Component
 * @param {Object} props - Component props
 * @param {boolean} props.collapsed - Sidebar collapse state
 * @param {Function} props.onCollapse - Callback when sidebar collapse changes
 * @param {string} props.selectedKey - Currently selected menu key
 */
const TechnicianSidebar = ({ collapsed, onCollapse, selectedKey }) => {
  const navigate = useNavigate();
  const menuItems = getMenuItems(navigate);

  /**
   * Handle user logout
   * Clears all authentication data and redirects to login
   */
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("password");

    // Clear sessionStorage
    sessionStorage.clear();

    // Redirect to login
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
      {/* Logo Area */}
      <div
        className="demo-logo-vertical"
        style={{
          height: 32,
          margin: 16,
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: 6,
        }}
      />

      {/* Menu */}
      <Menu
        theme="dark"
        selectedKeys={[selectedKey]}
        mode="inline"
        items={menuItems}
        style={{ marginBottom: 60 }}
      />

      {/* Logout Button */}
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

export default TechnicianSidebar;
