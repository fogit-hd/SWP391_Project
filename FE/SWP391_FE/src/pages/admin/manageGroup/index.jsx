// import React, { useState, useEffect } from "react";
// import {
//   Button,
//   Card,
//   Table,
//   Space,
//   Popconfirm,
//   message,
//   Spin,
//   Alert,
//   Breadcrumb,
//   Layout,
//   Menu,
//   theme,
// } from "antd";
// import {
//   EditOutlined,
//   DeleteOutlined,
//   PlusOutlined,
//   ReloadOutlined,
//   DesktopOutlined,
//   FileOutlined,
//   PieChartOutlined,
//   TeamOutlined,
//   UserOutlined,
//   UsergroupAddOutlined,
// } from "@ant-design/icons";
// import { Link } from "react-router-dom";

// const { Header, Content, Footer, Sider } = Layout;

// function getItem(label, key, icon, children) {
//   return {
//     key,
//     icon,
//     children,
//     label: children ? label : <Link to={key}>{label}</Link>,
//   };
// }

// const items = [
//   getItem("Dashboard", "/dashboard", <PieChartOutlined />),
//   getItem("User Management", "dropdown1", <UserOutlined />, [
//     getItem("Manage Accounts", "/manage-account", <UsergroupAddOutlined />),
//   ]),
//   getItem("Contract Management", "dropdown2", <UserOutlined />, [
//     getItem("Manage Contracts", "/manage-contract", <UsergroupAddOutlined />),
//   ]),
//   getItem("Service Management", "dropdown3", <UserOutlined />, [
//     getItem("Manage Services", "/manage-service", <UsergroupAddOutlined />),
//   ]),
// ];

// const ManageContract = () => {
//   return <div>ManageContract</div>;
// };
// export default ManageContract;

import React, { useState } from "react";
import {
  PieChartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { Link } from "react-router";
import { RiAccountCircle2Line } from "react-icons/ri";
import { MdOutlineManageAccounts } from "react-icons/md";
const { Header, Content, Footer, Sider } = Layout;
const items = [
  {
    key: "/dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/dashboard">Dashboard</Link>,
  },
  {
    key: "user-management",
    icon: <RiAccountCircle2Line />,
    label: "User Management",
    children: [
      {
        key: "/manage-account",
        icon: <MdOutlineManageAccounts />,
        label: <Link to="/manage-account">Manage Accounts</Link>,
      },
      {
        key: "/manage-group",
        icon: <TeamOutlined />,
        label: <Link to="/manage-group">Manage Group</Link>,
      },
    ],
  },
  {
    key: "contract-management",
    icon: <UserOutlined />,
    label: "Contract Management",
    children: [
      {
        key: "/manage-contract",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/manage-contract">Manage Contracts</Link>,
      },
    ],
  },
  {
    key: "service-management",
    icon: <UserOutlined />,
    label: "Service Management",
    children: [
      {
        key: "/manage-service",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/manage-service">Manage Services</Link>,
      },
    ],
  },
];
const ManageGroup = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        collapsedWidth={80}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={[
              { title: "Home" },
              { title: "Dashboard" },
              { title: "Manage Group" },
            ]}
          />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            Manage Group page is under construction.
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};
export default ManageGroup;
