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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const ManageAccount = () => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // API Configuration - Update these URLs with your actual API endpoints
  const API_BASE_URL = "http://localhost:8080/api"; // Replace with your API base URL
  const ENDPOINTS = {
    GET_USERS: "/users",
    DELETE_USER: "/users",
    UPDATE_USER: "/users",
    CREATE_USER: "/users",
  };

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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      // Add sorting parameters
      if (sortField && sortOrder) {
        params.append("sortBy", sortField);
        params.append("sortOrder", sortOrder === "ascend" ? "asc" : "desc");
      }

      // Add filter parameters
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key].length > 0) {
          params.append(key, filters[key].join(","));
        }
      });

      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.GET_USERS}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Add your auth token
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setData(result.data || result); // Adjust based on your API response structure
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: result.total || result.data?.length || 0,
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
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.DELETE_USER}/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
    <div style={{ padding: "24px" }}>
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
  );
};

export default ManageAccount;
