import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Space,
  Popconfirm,
  message,
  Spin,
  Alert,
  Breadcrumb,
  Layout,
  Menu,
  theme,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  PieChartOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../../config/axios";
import { RiAccountCircle2Line } from "react-icons/ri";
import { MdOutlineManageAccounts } from "react-icons/md";

const { Header, Content, Footer, Sider } = Layout;

const items = [
  {
    key: "/admin/dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "user-management",
    icon: <RiAccountCircle2Line />,
    label: "User Management",
    children: [
      {
        key: "/manage-account",
        icon: <MdOutlineManageAccounts />,
        label: <Link to="/admin/manageAccount">Manage Accounts</Link>,
      },
      {
        key: "/manage-group",
        icon: <TeamOutlined />,
        label: <Link to="/admin/manageGroup">Manage Group</Link>,
      },
    ],
  },
  {
    key: "contract-management",
    icon: <UserOutlined />,
    label: "Contract Management",
    children: [
      {
        key: "/manageContract",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/admin/manageContract">Manage Contracts</Link>,
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
        label: <Link to="/admin/manageService">Manage Services</Link>,
      },
    ],
  },
];

const ManageAccount = () => {
  // Layout state
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // // API Endpoints
  // const ENDPOINTS = {
  //   GET_USERS: "/users",
  //   DELETE_USER: "/users",
  //   UPDATE_USER: "/users",
  //   CREATE_USER: "/users",
  // };

  const columns = [
    {
      title: "UUID",
      dataIndex: "uuid",
      key: "uuid",
      sorter: false,
    },
    {
      title: "Name",
      dataIndex: "Name",
      key: "Name",
      sorter: false,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: false,
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      sorter: false,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: false,
      filters: [
        { text: "Admin", value: "Admin" },
        { text: "User", value: "User" },
      ],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      render: (status) => (
        <span style={{ color: status === "Active" ? "green" : "red" }}>
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // API Functions
  const fetchUsers = async (
    page = 1,
    pageSize = 10,
    sortField = null,
    sortOrder = null,
    filters = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page.toString(),
        limit: pageSize.toString(),
      };

      // Add sorting parameters
      if (sortField && sortOrder) {
        params.sortBy = sortField;
        params.sortOrder = sortOrder === "ascend" ? "asc" : "desc";
      }

      // Add filter parameters
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key].length > 0) {
          params[key] = filters[key].join(",");
        }
      });

      const response = await api.get("/users", { params });

      setData(response.data.data || response.data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.data.total || response.data.data?.length || 0,
      }));
    } catch (err) {
      setError(err.message);
      message.error(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);

      message.success("User deleted successfully");
      // Refresh the data
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(`Failed to delete user: ${err.message}`);
    }
  };

  // Event Handlers
  const handleEdit = (record) => {
    message.info(`Edit user: ${record.name}`);
    // TODO: Implement edit modal/form
    // You can open a modal or navigate to edit page
  };

  const handleDelete = (id) => {
    deleteUser(id);
  };

  const handleAddUser = () => {
    message.info("Add new user");
    // TODO: Implement add user modal/form
    // You can open a modal or navigate to add user page
  };

  const handleRefresh = () => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  const handleTableChange = (paginationConfig, filters, sorter) => {
    const { current, pageSize } = paginationConfig;
    const { field, order } = sorter;

    fetchUsers(current, pageSize, field, order, filters);
  };

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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
          defaultSelectedKeys={["/manage-account"]}
          mode="inline"
          items={items}
          accordion
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
              { title: "Manage Accounts" },
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
            <Card
              title="User Management"
              extra={
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddUser}
                  >
                    Add User
                  </Button>
                </Space>
              }
            >
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button size="small" onClick={handleRefresh}>
                      Retry
                    </Button>
                  }
                />
              )}

              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} users`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  onChange={handleTableChange}
                  scroll={{ x: 1200 }}
                />
              </Spin>
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

export default ManageAccount;
