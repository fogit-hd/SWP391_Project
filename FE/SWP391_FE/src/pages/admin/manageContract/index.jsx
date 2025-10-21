import React, { useState, useEffect } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  theme,
  Button,
  Typography,
  Table,
  Space,
  Tag,
  Popconfirm,
  Form,
} from "antd";
import { toast } from "react-toastify";
import api from "../../../config/axios";
import ContractPreview from "../../../components/ContractPreview";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import "./ManageContract.css";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const ManageContract = () => {
  const [collapsed, setCollapsed] = useState(false);
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
  const [contractPreviewVisible, setContractPreviewVisible] = useState(false);
  const [htmlPreviewVisible, setHtmlPreviewVisible] = useState(false);

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
  const handleCreateTemplate = async () => {
    try {
      // Reset form and prepare for new template creation
      setSelectedTemplate(null);
      templateForm.resetFields();

      // Set default values for new template
      templateForm.setFieldsValue({
        name: "New Template",
        description: "Description of the new template",
        version: "1.0",
        content: "",
        minCoOwners: 1,
        maxCoOwners: 10,
      });

      // Open the contract preview modal for editing
      setContractPreviewVisible(true);
    } catch (error) {
      console.error("Error preparing template creation:", error);
      toast.error(
        "An error occurred while preparing to create a new template."
      );
    }
  };

  const handlePreviewTemplate = async (template) => {
    setSelectedTemplate(template);

    // Load variables and clauses for this template (same logic as handleEditTemplate)
    await loadTemplateVariables(template.id);
    await loadTemplateClauses(template.id);

    setContractPreviewVisible(true);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setLoading(true);

      // Prepare the API request body according to the API documentation
      const requestBody = {
        name: templateData.name || "New Template",
        description:
          templateData.description || "Description of the new template",
        version: templateData.version || "1.0",
        content: templateData.content || "",
        minCoOwners: templateData.minCoOwners || 1,
        maxCoOwners: templateData.maxCoOwners || 10,
      };

      console.log("Creating template with data:", requestBody);

      const response = await api.post("/contract-templates", requestBody);

      toast.success("Template created successfully");

      console.log("Template creation response:", response);

      // Reload templates to show the new one
      await loadTemplates();

      // Close the modal
      setContractPreviewVisible(false);
    } catch (error) {
      console.error("Error creating template:", error);

      // Handle different types of errors
      if (error.response?.status === 400) {
        toast.error("Invalid template data. Please check all fields.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === "ERR_NETWORK") {
        toast.error(
          "The contract is currently in use; deleting it could cause a conflict."
        );
      } else {
        toast.error(`Failed to create template: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
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
      console.log("Attempting to delete template:", templateId);
      const response = await api.delete(`/contract-templates/${templateId}`);
      console.log("Delete response:", response);
      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);

      // Check if it's a CORS error
      if (error.code === "ERR_NETWORK" || error.message.includes("CORS")) {
        toast.error(
          "Cannot connect to server. Please check your internet connection or try again later."
        );
      } else if (error.response?.status === 500) {
        toast.error("Server error (500). Please try again later.");
      } else if (error.response?.status === 404) {
        toast.error("Template not found or already deleted.");
      } else {
        toast.error(`Failed to delete template: ${error.message}`);
      }
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
            onClick={() => handlePreviewTemplate(record)}
            className="manage-contract-btn manage-contract-btn-primary"
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
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-templates"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
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

      {/* Contract Preview Modal */}
      <ContractPreview
        visible={contractPreviewVisible}
        template={selectedTemplate}
        onClose={() => setContractPreviewVisible(false)}
        onTemplateUpdate={(updatedTemplate) => {
          console.log("=== TEMPLATE UPDATE CALLBACK ===");
          console.log("Updated template:", updatedTemplate);

          // Update the template in the list
          setTemplates((prevTemplates) =>
            prevTemplates.map((template) =>
              template.id === updatedTemplate.id ? updatedTemplate : template
            )
          );
          setSelectedTemplate(updatedTemplate);

          // Reload templates to ensure data consistency
          loadTemplates();

          toast.success("Template updated successfully");
        }}
        onTemplateSave={handleSaveTemplate}
        onGenerateContract={(data) => {
          console.log("Generated contract data:", data);
          toast.success("Contract generated successfully!");
        }}
      />
    </Layout>
  );
};

export default ManageContract;
