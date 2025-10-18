import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Popconfirm,
  message,
  Tag,
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import "./ClausesManager.css";

const { TextArea } = Input;

const ClausesManager = ({ templateId, visible, onClose, onClausesChange }) => {
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClause, setEditingClause] = useState(null);
  const [form] = Form.useForm();

  // Load clauses when component mounts or templateId changes
  useEffect(() => {
    if (templateId && visible) {
      loadClauses();
    }
  }, [templateId, visible]);

  const loadClauses = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/contract-templates/${templateId}/clauses`
      );
      const clausesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setClauses(clausesData);
    } catch (error) {
      console.error("Error loading clauses:", error);
      message.error("Failed to load clauses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClause = () => {
    setEditingClause(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditClause = (clause) => {
    setEditingClause(clause);
    form.setFieldsValue({
      title: clause.title,
      body: clause.body,
      orderIndex: clause.orderIndex,
      isMandatory: clause.isMandatory,
    });
    setModalVisible(true);
  };

  const handleDeleteClause = async (clauseId) => {
    try {
      // Validate IDs
      if (!templateId) {
        message.error("Template ID is missing");
        return;
      }
      
      if (!clauseId) {
        message.error("Clause ID is missing");
        return;
      }
      
      // First, check if the clause exists by trying to get it
      try {
        await api.get(`/contract-templates/clauses/${clauseId}`);
      } catch (getError) {
        if (getError.response?.status === 404) {
          message.error("Clause not found. It may have been deleted already.");
          loadClauses();
          return;
        }
      }
      
      // Try the delete API call
      await api.delete(`/contract-templates/clauses/${clauseId}`);
      message.success("Clause deleted successfully");
      loadClauses();
      if (onClausesChange) {
        onClausesChange();
      }
    } catch (error) {
      console.error("Error deleting clause:", error);
      message.error("Failed to delete clause");
    }
  };

  const handleSaveClause = async (values) => {
    try {
      setLoading(true);

      if (editingClause) {
        // Update existing clause
        await api.put(
          `/contract-templates/clauses/${editingClause.id}`,
          values
        );
        message.success("Clause updated successfully");
      } else {
        // Create new clause
        await api.post(`/contract-templates/${templateId}/clauses`, values);
        message.success("Clause created successfully");
      }

      setModalVisible(false);
      loadClauses();
      if (onClausesChange) {
        onClausesChange();
      }
    } catch (error) {
      console.error("Error saving clause:", error);
      message.error("Failed to save clause");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Order",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 80,
      render: (order) => <Tag color="blue">#{order}</Tag>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
      ellipsis: true,
      width: 300,
      render: (text) => (
        <div style={{ maxWidth: "300px" }}>{text?.substring(0, 100)}...</div>
      ),
    },
    {
      title: "Mandatory",
      dataIndex: "isMandatory",
      key: "isMandatory",
      width: 100,
      render: (mandatory) => (
        <Tag color={mandatory ? "red" : "green"}>
          {mandatory ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => {
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditClause(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this clause?"
              onConfirm={() => {
                // Use the correct ID field
                const clauseId = record.id || record.clauseId || record._id;
                handleDeleteClause(clauseId);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="clauses-manager">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Clauses Management</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddClause}
          className="ant-btn-primary"
        >
          Add Clause
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={clauses}
        loading={loading}
        rowKey="id"
        className="ant-table"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} clauses`,
        }}
      />

      {/* Clause Form Modal */}
      <Modal
        title={editingClause ? "Edit Clause" : "Add New Clause"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="clauses-manager"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveClause}
          className="clauses-manager"
          initialValues={{
            orderIndex: 1,
            isMandatory: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderIndex"
                label="Order Index"
                rules={[
                  { required: true, message: "Please input order index!" },
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: "100%" }}
                  placeholder="Order in template"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isMandatory"
                label="Mandatory Clause"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="Clause Title"
            rules={[{ required: true, message: "Please input clause title!" }]}
          >
            <Input placeholder="e.g., Article 1. Purpose of Contract" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Clause Content"
            rules={[
              { required: true, message: "Please input clause content!" },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Enter the full content of this clause..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingClause ? "Update Clause" : "Create Clause"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClausesManager;
