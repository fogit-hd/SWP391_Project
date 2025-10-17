import React, { useState, useEffect } from "react";
import {
  PieChartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  SettingOutlined,
  DeleteOutlined,
  EyeOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  Tabs,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../config/axios";
import ContractEditor from "../../../components/ContractEditor";
import VariablesManager from "../../../components/VariablesManager";
import ClausesManager from "../../../components/ClausesManager";
import ContractPreview from "../../../components/ContractPreview";
import "./ManageContract.css";

const { Header, Content, Footer, Sider } = Layout;
const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const items = [
  {
    key: "/admin/dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "user-management",
    icon: <UserOutlined />,
    label: "User Management",
    children: [
      {
        key: "/admin/manage-account",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/admin/manage-account">Manage Accounts</Link>,
      },
      {
        key: "/admin/manage-group",
        icon: <TeamOutlined />,
        label: <Link to="/admin/manage-group">Manage Group</Link>,
      },
    ],
  },
  {
    key: "contract-management",
    icon: <FileTextOutlined />,
    label: "Contract Management",
    children: [
      {
        key: "/admin/manage-contract",
        icon: <FileTextOutlined />,
        label: <Link to="/admin/manage-contract">Manage Templates</Link>,
      },
    ],
  },
  {
    key: "service-management",
    icon: <SettingOutlined />,
    label: "Service Management",
    children: [
      {
        key: "/admin/manage-service",
        icon: <SettingOutlined />,
        label: <Link to="/admin/manage-service">Manage Services</Link>,
      },
    ],
  },
];
const ManageContract = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // State management
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [templateClauses, setTemplateClauses] = useState([]);

  // Modal states
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // Forms
  const [templateForm] = Form.useForm();

  // Contract data context

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get("/contract-templates");
      const templatesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setTemplates(templatesData);
      toast.success("Templates loaded successfully");
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // Template CRUD operations
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    templateForm.resetFields();
    setTemplateModalVisible(true);
  };

  const handleEditTemplate = async (template) => {
    setSelectedTemplate(template);
    templateForm.setFieldsValue({
      name: template.name,
      description: template.description,
      version: template.version,
      minCoOwners: template.minCoOwners,
      maxCoOwners: template.maxCoOwners,
    });

    // Load variables and clauses for this template
    await loadTemplateVariables(template.id);
    await loadTemplateClauses(template.id);

    setTemplateModalVisible(true);
  };

  const loadTemplateVariables = async (templateId) => {
    try {
      const response = await api.get(
        `/contract-templates/${templateId}/variables`
      );
      const variablesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setTemplateVariables(variablesData);
    } catch (error) {
      console.error("Error loading template variables:", error);
      setTemplateVariables([]);
    }
  };

  const loadTemplateClauses = async (templateId) => {
    try {
      const response = await api.get(
        `/contract-templates/${templateId}/clauses`
      );
      const clausesData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setTemplateClauses(clausesData);
    } catch (error) {
      console.error("Error loading template clauses:", error);
      setTemplateClauses([]);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/contract-templates/${templateId}`);
      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleSaveTemplate = async (values) => {
    try {
      setLoading(true);

      const templateData = {
        name: values.name,
        description: values.description,
        version: values.version,
        minCoOwners: values.minCoOwners,
        maxCoOwners: values.maxCoOwners,
        content: selectedTemplate?.content || "",
        variables: selectedTemplate?.variables || [],
        clauses: selectedTemplate?.clauses || [],
      };

      if (selectedTemplate) {
        // Update existing template
        await api.put(
          `/contract-templates/${selectedTemplate.id}`,
          templateData
        );
        toast.success("Template updated successfully");
      } else {
        // Create new template
        await api.post("/contract-templates", templateData);
        toast.success("Template created successfully");
      }

      setTemplateModalVisible(false);
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  // Content management
  const handleSaveContent = async (editorData) => {
    try {
      setLoading(true);

      // Sử dụng cleanHtml cho BE (loại bỏ span tags, chỉ giữ Mustache syntax)
      const contentForBackend =
        editorData.cleanHtml || editorData.backendHtml || editorData.html;

      console.log("=== SENDING TO BACKEND ===");
      console.log("Original HTML:", editorData.html);
      console.log("Clean HTML for Backend:", contentForBackend);
      console.log("Editor Data:", editorData);

      const response = await api.put(
        `/contract-templates/${selectedTemplate.id}/content`,
        {
          content: contentForBackend,
        }
      );

      toast.success("Content updated successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setLoading(false);
    }
  };
  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            v{record.version}
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Co-Owners",
      key: "coOwners",
      render: (_, record) => (
        <Tag className="manage-contract-tag manage-contract-tag-count">
          {record.minCoOwners}-{record.maxCoOwners} owners
        </Tag>
      ),
    },
    {
      title: "Variables",
      key: "variables",
      render: (_, record) => (
        <Tag className="manage-contract-tag manage-contract-tag-count">
          {record.variables?.length || 0} variables
        </Tag>
      ),
    },
    {
      title: "Clauses",
      key: "clauses",
      render: (_, record) => (
        <Tag className="manage-contract-tag manage-contract-tag-count">
          {record.clauses?.length || 0} clauses
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space className="manage-contract-actions">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
            className="manage-contract-btn manage-contract-btn-secondary"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="manage-contract-btn manage-contract-btn-danger"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="manage-contract-container">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        collapsedWidth={80}
        className="manage-contract-sidebar"
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["/admin/manage-contract"]}
          mode="inline"
          items={items}
          className="manage-contract-menu"
        />
      </Sider>
      <Layout>
        <Header className="manage-contract-header" />
        <Content className="manage-contract-content">
          <Breadcrumb
            className="manage-contract-breadcrumb"
            items={[
              { title: "Home" },
              { title: "Admin" },
              { title: "Manage Templates" },
            ]}
          />
          <div className="manage-contract-main-content">
            <div className="manage-contract-header-section">
              <div>
                <Title level={2} className="manage-contract-title">
                  Contract Templates
                </Title>
                <Paragraph className="manage-contract-subtitle">
                  Manage contract templates, variables, clauses and content.
                </Paragraph>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  type="default"
                  onClick={loadTemplates}
                  className="manage-contract-btn manage-contract-btn-secondary"
                >
                  🔄 Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateTemplate}
                  size="large"
                  className="manage-contract-btn manage-contract-btn-primary"
                >
                  Create New Template
                </Button>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={templates}
              loading={loading}
              rowKey="id"
              className="manage-contract-table"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} templates`,
              }}
            />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>

      {/* Template CRUD Modal */}
      <Modal
        title={selectedTemplate ? "Edit Template" : "Create New Template"}
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={selectedTemplate ? 1000 : 600}
        className="manage-contract-modal"
        style={{ top: 20 }}
      >
        {selectedTemplate ? (
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: "basic",
                label: "Basic Information",
                children: (
                  <Form
                    form={templateForm}
                    layout="vertical"
                    onFinish={handleSaveTemplate}
                    className="manage-contract-form"
                    initialValues={{
                      name: selectedTemplate.name,
                      description: selectedTemplate.description,
                      version: selectedTemplate.version || "1.0",
                      minCoOwners: selectedTemplate.minCoOwners || 1,
                      maxCoOwners: selectedTemplate.maxCoOwners || 5,
                    }}
                  >
                    <Form.Item
                      name="name"
                      label="Template Name"
                      rules={[
                        {
                          required: true,
                          message: "Please input template name!",
                        },
                      ]}
                    >
                      <Input placeholder="Enter template name" />
                    </Form.Item>

                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[
                        {
                          required: true,
                          message: "Please input description!",
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Enter template description"
                      />
                    </Form.Item>

                    <Form.Item
                      name="version"
                      label="Version"
                      rules={[
                        { required: true, message: "Please input version!" },
                      ]}
                    >
                      <Input placeholder="e.g., 1.0" />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="minCoOwners"
                          label="Min Co-Owners"
                          rules={[
                            {
                              required: true,
                              message: "Please input min co-owners!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            max={10}
                            style={{ width: "100%" }}
                            placeholder="Min"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="maxCoOwners"
                          label="Max Co-Owners"
                          rules={[
                            {
                              required: true,
                              message: "Please input max co-owners!",
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            max={10}
                            style={{ width: "100%" }}
                            placeholder="Max"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                      <Space>
                        <Button onClick={() => setTemplateModalVisible(false)}>
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                        >
                          Update Template
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: "content",
                label: "Content",
                children: (
                  <div>
                    <ContractPreview
                      templateContent={selectedTemplate.content || ""}
                      variables={templateVariables}
                      clauses={templateClauses}
                      onGenerateContract={(data) => {
                        console.log("Generated contract data:", data);
                        toast.success("Contract generated successfully!");
                      }}
                    />
                    <ContractEditor
                      initialContent={selectedTemplate.content || ""}
                      onSave={(content) => handleSaveContent(content)}
                      placeholder="Edit template content. e.g: Use {{variableName}} for dynamic variables."
                      variables={templateVariables}
                      clauses={templateClauses}
                    />
                  </div>
                ),
              },
              {
                key: "variables",
                label: "Variables",
                children: (
                  <div className="variables-manager">
                    {selectedTemplate ? (
                      <VariablesManager
                        templateId={selectedTemplate.id}
                        visible={true}
                        onClose={() => {}}
                        onVariablesChange={() => {
                          loadTemplateVariables(selectedTemplate.id);
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        Please select a template first
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "clauses",
                label: "Clauses",
                children: (
                  <div className="clauses-manager">
                    {selectedTemplate ? (
                      <ClausesManager
                        templateId={selectedTemplate.id}
                        visible={true}
                        onClose={() => {}}
                        onClausesChange={() => {
                          loadTemplateClauses(selectedTemplate.id);
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        Please select a template first
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <Form
            form={templateForm}
            layout="vertical"
            onFinish={handleSaveTemplate}
            className="manage-contract-form"
            initialValues={{
              version: "1.0",
              minCoOwners: 1,
              maxCoOwners: 5,
            }}
          >
            <Form.Item
              name="name"
              label="Template Name"
              rules={[
                { required: true, message: "Please input template name!" },
              ]}
            >
              <Input placeholder="Enter template name" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please input description!" }]}
            >
              <TextArea rows={3} placeholder="Enter template description" />
            </Form.Item>

            <Form.Item
              name="version"
              label="Version"
              rules={[{ required: true, message: "Please input version!" }]}
            >
              <Input placeholder="e.g., 1.0" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="minCoOwners"
                  label="Min Co-Owners"
                  rules={[
                    { required: true, message: "Please input min co-owners!" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: "100%" }}
                    placeholder="Min"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxCoOwners"
                  label="Max Co-Owners"
                  rules={[
                    { required: true, message: "Please input max co-owners!" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: "100%" }}
                    placeholder="Max"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setTemplateModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Template
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
};
export default ManageContract;
