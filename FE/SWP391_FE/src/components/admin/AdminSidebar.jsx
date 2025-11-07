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
  ToolOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Sider } = Layout;

/**
 * Get menu items for Admin Sidebar
 * @param {Function} navigate - Navigation function from useNavigate hook
 * @param {Object} auth - Auth object from useAuth hook
 * @returns {Array} Menu items configuration
 */
const getMenuItems = (navigate, auth) => [
  {
    key: "dashboard",
    icon: <PieChartOutlined />,
    label: "Dashboard",
    onClick: () => {
      // Smart redirect based on user role
      if (auth.isAdmin) {
        navigate("/admin/dashboard");
      } else if (auth.isStaff) {
        navigate("/staff/dashboard");
      } else if (auth.isTechnician) {
        navigate("/technician/dashboard");
      } else {
        navigate("/admin/dashboard"); // Default to admin
      }
    },
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
      {
        key: "review-econtracts",
        icon: <FileTextOutlined />,
        label: <Link to="/staff/review-econtract">Review E-Contracts</Link>,
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
      {
        key: "manage-vehicle-requests",
        icon: <FileTextOutlined />,
        label: <Link to="/admin/manage-vehicle-requests">Manage Vehicle Requests</Link>,
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
 * Admin Sidebar Component
 * @param {Object} props - Component props
 * @param {boolean} props.collapsed - Sidebar collapse state
 * @param {Function} props.onCollapse - Callback when sidebar collapse changes
 * @param {string} props.selectedKey - Currently selected menu key
 */
const AdminSidebar = ({ collapsed, onCollapse, selectedKey }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const menuItems = getMenuItems(navigate, auth);

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

export default AdminSidebar;
