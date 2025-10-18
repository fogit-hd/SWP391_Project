import React from "react";
import { Layout, Button, Space, Avatar, Dropdown, Typography } from "antd";
import { UserOutlined, LogoutOutlined, HistoryOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/accountSlice";

import "../../pages/home/home.css";


const { Header } = Layout;
const { Title, Text } = Typography;

const AppHeader = () => {
  const account = useSelector((store) => store.account);
  const dispatch = useDispatch();

  const user = {
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=2080",
  };

  const handleLogout = () => dispatch(logout());

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "My Profile" },
    { key: "history", icon: <HistoryOutlined />, label: "History" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Logout", onClick: handleLogout },
  ];

  return (
    <Header className="header">
      <Title level={2} className="site-title">EVCS</Title>

      <Space className="nav-menu">
        <Link to="/available">
          <Button type="text" className="nav-menu-button">Available teams</Button>
        </Link>
        <Link to="/contact">
          <Button type="text" className="nav-menu-button">Contact Us</Button>
        </Link>
      </Space>

      <Space className="header-actions">
        {account ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Space className="user-profile">
              <Text className="user-name">{account.fullName}</Text>
              <Avatar src={user.avatar} size={40} className="user-avatar" />
            </Space>
          </Dropdown>
        ) : (
          <Space className="auth-buttons">
            <Link to="/login">
              <Button ghost className="nav-button">Login</Button>
            </Link>
            <Link to="/register">
              <Button type="primary" className="nav-button"
              >
                Register
              </Button>
            </Link>
          </Space>
        )}
      </Space>
    </Header>
  );
};

export default AppHeader;
