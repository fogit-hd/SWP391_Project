import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
import "./VariablesManager.css";

const { Option } = Select;

const VariablesManager = ({ templateId, visible, onVariablesChange }) => {
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [form] = Form.useForm();

  // Load variables when component mounts or templateId changes
  useEffect(() => {
    if (templateId && visible) {
      loadVariables();
    }
  }, [templateId, visible]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/contract-templates/${templateId}/variables`
      );
      const variablesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setVariables(variablesData);
    } catch (error) {
      console.error("Error loading variables:", error);
      message.error("Failed to load variables");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariable = () => {
    setEditingVariable(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditVariable = (variable) => {
    setEditingVariable(variable);
    form.setFieldsValue({
      variableName: variable.variableName,
      displayLabel: variable.displayLabel,
      inputType: variable.inputType,
      isRequired: variable.isRequired,
      defaultValue: variable.defaultValue,
    });
    setModalVisible(true);
  };

  const handleDeleteVariable = async (variableId) => {
    try {
      // Validate IDs
      if (!templateId) {
        message.error("Template ID is missing");
        return;
      }

      if (!variableId) {
        message.error("Variable ID is missing");
        return;
      }

      // First, check if the variable exists by trying to get it
      try {
        await api.get(`/contract-templates/variables/${variableId}`);
      } catch (getError) {
        if (getError.response?.status === 404) {
          message.error(
            "Variable not found. It may have been deleted already."
          );
          loadVariables();
          return;
        }
      }

      // Try the delete API call
      await api.delete(`/contract-templates/variables/${variableId}`);
      message.success("Variable deleted successfully");
      loadVariables();
      if (onVariablesChange) {
        onVariablesChange();
      }
    } catch (error) {
      console.error("Error deleting variable:", error);
      message.error("Failed to delete variable");
    }
  };

  const handleSaveVariable = async (values) => {
    try {
      setLoading(true);

      if (editingVariable) {
        // Update existing variable
        await api.put(
          `/contract-templates/variables/${editingVariable.id}`,
          values
        );
        message.success("Variable updated successfully");
      } else {
        // Create new variable
        await api.post(`/contract-templates/${templateId}/variables`, values);
        message.success("Variable created successfully");
      }

      setModalVisible(false);
      loadVariables();
      if (onVariablesChange) {
        onVariablesChange();
      }
    } catch (error) {
      console.error("Error saving variable:", error);
      message.error("Failed to save variable");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Variable Name",
      dataIndex: "variableName",
      key: "variableName",
      render: (text) => <code>{`{{${text}}}`}</code>,
    },
    {
      title: "Display Label",
      dataIndex: "displayLabel",
      key: "displayLabel",
    },
    {
      title: "Input Type",
      dataIndex: "inputType",
      key: "inputType",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Required",
      dataIndex: "isRequired",
      key: "isRequired",
      render: (required) => (
        <Tag color={required ? "red" : "green"}>{required ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Default Value",
      dataIndex: "defaultValue",
      key: "defaultValue",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        console.log("🔍 Variable record for actions:", record);
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditVariable(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this variable?"
              onConfirm={() => {
                console.log(
                  "🗑️ Delete confirmation clicked for record:",
                  record
                );
                // Try different possible ID fields
                const variableId = record.id || record.variableId || record._id;
                console.log("🔍 Using variableId:", variableId);
                handleDeleteVariable(variableId);
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
    <div className="variables-manager">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Variables Management</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddVariable}
          className="ant-btn-primary"
        >
          Add Variable
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={variables}
        loading={loading}
        rowKey="id"
        className="ant-table"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} variables`,
        }}
      />

      {/* Variable Form Modal */}
      <Modal
        title={editingVariable ? "Edit Variable" : "Add New Variable"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="variables-manager"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveVariable}
          className="variables-manager"
          initialValues={{
            inputType: "text",
            isRequired: false,
          }}
        >
          <Form.Item
            name="variableName"
            label="Variable Name"
            rules={[
              { required: true, message: "Please input variable name!" },
              {
                pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                message:
                  "Variable name must start with letter or underscore and contain only letters, numbers, and underscores",
              },
            ]}
          >
            <Input placeholder="e.g., contractDate, buyerName" />
          </Form.Item>

          <Form.Item
            name="displayLabel"
            label="Display Label"
            rules={[{ required: true, message: "Please input display label!" }]}
          >
            <Input placeholder="e.g., Contract Date, Buyer Name" />
          </Form.Item>

          <Form.Item
            name="inputType"
            label="Input Type"
            rules={[{ required: true, message: "Please select input type!" }]}
          >
            <Select placeholder="Select input type">
              <Option value="text">Text</Option>
              <Option value="number">Number</Option>
              <Option value="email">Email</Option>
              <Option value="date">Date</Option>
              <Option value="textarea">Textarea</Option>
              <Option value="select">Select</Option>
              <Option value="group">Group</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isRequired" label="Required" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="defaultValue" label="Default Value">
            <Input placeholder="Enter default value (optional)" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingVariable ? "Update Variable" : "Create Variable"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VariablesManager;
