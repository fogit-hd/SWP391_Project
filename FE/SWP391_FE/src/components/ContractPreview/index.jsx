import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Button,
  Space,
  Typography,
  message,
  Divider,
  Card,
  Tag,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import ContractEditor from "../ContractEditor";
import VariablesManager from "../VariablesManager";
import ClausesManager from "../ClausesManager";
import api from "../../config/axios";

const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * ContractPreview Component
 *
 * A comprehensive modal component for managing contract templates with multiple tabs:
 * - Basic Information: Template metadata and settings
 * - Content: Rich text editor for template content
 * - Variables: Variable management with CRUD operations
 * - Clauses: Clause management with CRUD operations
 *
 * Features:
 * - Modal-based interface with tabbed navigation
 * - Real-time data synchronization
 * - Form validation and error handling
 * - Integration with existing components
 * - Auto-save functionality
 */
const ContractPreview = ({ visible, template, onClose, onTemplateUpdate, onTemplateSave }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [templateData, setTemplateData] = useState(null);
  const [variables, setVariables] = useState([]);
  const [clauses, setClauses] = useState([]);

  // Forms
  const [templateForm] = Form.useForm();

  // Initialize component data when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab("basic");
      
      if (template) {
        // Existing template - load data
        setTemplateData(template);
        loadTemplateData(template.id);

        // Set form values
        templateForm.setFieldsValue({
          name: template.name,
          description: template.description,
          version: template.version,
          minCoOwners: template.minCoOwners,
          maxCoOwners: template.maxCoOwners,
        });
      } else {
        // New template - set default values
        const defaultTemplate = {
          name: "New Template",
          description: "Description of the new template",
          version: "1.0",
          content: "",
          minCoOwners: 1,
          maxCoOwners: 10,
        };
        setTemplateData(defaultTemplate);
        setVariables([]);
        setClauses([]);

        // Set form values
        templateForm.setFieldsValue({
          name: defaultTemplate.name,
          description: defaultTemplate.description,
          version: defaultTemplate.version,
          minCoOwners: defaultTemplate.minCoOwners,
          maxCoOwners: defaultTemplate.maxCoOwners,
        });
      }
    }
  }, [visible, template]);

  // Refresh data when templateData changes
  useEffect(() => {
    if (templateData && visible) {
      // Update form values when templateData changes
      templateForm.setFieldsValue({
        name: templateData.name,
        description: templateData.description,
        version: templateData.version,
        minCoOwners: templateData.minCoOwners,
        maxCoOwners: templateData.maxCoOwners,
      });
    }
  }, [templateData, visible]);

  // Load template data (variables, clauses, content)
  const loadTemplateData = async (templateId) => {
    if (!templateId) return;

    try {
      setLoading(true);

      // Load full template data including content
      const templateResponse = await api.get(`/contract-templates/${templateId}`);
      const fullTemplateData = templateResponse.data?.data || templateResponse.data;
      
      // Update templateData with full template including content
      if (fullTemplateData) {
        setTemplateData(prevData => ({
          ...prevData,
          ...fullTemplateData,
          content: fullTemplateData.content || ""
        }));
      }

      // Load variables
      const variablesResponse = await api.get(
        `/contract-templates/${templateId}/variables`
      );
      const variablesData = Array.isArray(variablesResponse.data)
        ? variablesResponse.data
        : variablesResponse.data?.data || [];
      setVariables(variablesData);
      
      // Load clauses
      const clausesResponse = await api.get(
        `/contract-templates/${templateId}/clauses`
      );
      const clausesData = Array.isArray(clausesResponse.data)
        ? clausesResponse.data
        : clausesResponse.data?.data || [];
      setClauses(clausesData);
    } catch (error) {
      console.error("Error loading template data:", error);
      message.error("Failed to load template data");
    } finally {
      setLoading(false);
    }
  };

  // Handle template basic information update
  const handleTemplateUpdate = async (values) => {
    if (!templateData) return;

    try {
      setLoading(true);

      // Ensure numeric values are properly formatted
      const processedValues = {
        ...values,
        minCoOwners: values.minCoOwners
          ? parseInt(values.minCoOwners)
          : templateData.minCoOwners,
        maxCoOwners: values.maxCoOwners
          ? parseInt(values.maxCoOwners)
          : templateData.maxCoOwners,
      };

      const updateData = {
        ...templateData,
        ...processedValues,
      };

      // Check if this is a new template (no ID) or existing template
      if (!templateData.id) {
        // New template - use onTemplateSave callback
        if (onTemplateSave) {
          await onTemplateSave(updateData);
        }
      } else {
        // Existing template - update via API
        const response = await api.put(
          `/contract-templates/${templateData.id}`,
          updateData
        );

        // Handle different response structures
        const updatedTemplate = response.data?.data || response.data;

        // Update local state
        setTemplateData(updatedTemplate);

        // Update form values to reflect changes immediately
        templateForm.setFieldsValue({
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          version: updatedTemplate.version,
          minCoOwners: updatedTemplate.minCoOwners,
          maxCoOwners: updatedTemplate.maxCoOwners,
        });

        message.success("Template updated successfully");

        if (onTemplateUpdate) {
          onTemplateUpdate(updatedTemplate);
        }
      }
    } catch (error) {
      console.error("Error updating template:", error);
      message.error("Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  // Handle content save from ContractEditor
  const handleContentSave = async (editorData) => {
    if (!templateData) return;

    try {
      setLoading(true);

      const contentForBackend =
        editorData.cleanHtml || editorData.backendHtml || editorData.html;

      // Update local state with new content immediately
      const updatedTemplate = {
        ...templateData,
        content: editorData.html || contentForBackend
      };
      setTemplateData(updatedTemplate);

      // If this is an existing template (has ID), save to backend
      if (templateData.id) {
        const response = await api.put(
          `/contract-templates/${templateData.id}/content`,
          { content: contentForBackend }
        );

        // Handle different response structures
        const backendUpdatedTemplate = response.data?.data || response.data;
        if (backendUpdatedTemplate) {
          setTemplateData(backendUpdatedTemplate);
        }
      }

      message.success("Content updated successfully");

      if (onTemplateUpdate) {
        onTemplateUpdate(updatedTemplate);
      }
    } catch (error) {
      console.error("Error saving content:", error);
      message.error("Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  // Handle variables change
  const handleVariablesChange = () => {
    loadTemplateData(templateData.id);
  };

  // Handle clauses change
  const handleClausesChange = () => {
    loadTemplateData(templateData.id);
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  // Tab items configuration
  const tabItems = [
    {
      key: "basic",
      label: (
        <span>
          <InfoCircleOutlined /> Basic Information
        </span>
      ),
      children: (
        <div style={{ padding: "20px 0" }}>
          <Card title="Template Information" size="small">
            <Form
              form={templateForm}
              layout="vertical"
              onFinish={handleTemplateUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
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
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="version"
                    label="Version"
                    rules={[
                      { required: true, message: "Please input version!" },
                    ]}
                  >
                    <Input placeholder="e.g., 1.0" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please input description!" },
                ]}
              >
                <TextArea rows={3} placeholder="Enter template description" />
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
                      {
                        type: "number",
                        min: 1,
                        max: 10,
                        message: "Min co-owners must be between 1 and 10",
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
                      {
                        type: "number",
                        min: 1,
                        max: 10,
                        message: "Max co-owners must be between 1 and 10",
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

              <Divider />

              <div style={{ textAlign: "right" }}>
                <Space>
                  <Button onClick={handleClose}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Save Changes
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: "content",
      label: <span>Content Editor</span>,
      children: (
        <div style={{ height: "600px" }}>
          <ContractEditor
            key={templateData?.id || 'new-template'}
            initialContent={templateData?.content || ""}
            onSave={handleContentSave}
            placeholder="Edit template content. Use {{variableName}} for dynamic variables."
            variables={variables}
            clauses={clauses}
            loading={loading}
          />
        </div>
      ),
    },
    {
      key: "variables",
      label: <span>Variables</span>,
      children: (
        <div>
          <VariablesManager
            templateId={templateData?.id}
            visible={true}
            onClose={() => {}}
            onVariablesChange={handleVariablesChange}
          />
        </div>
      ),
    },
    {
      key: "clauses",
      label: <span>Clauses</span>,
      children: (
        <div>
          <ClausesManager
            templateId={templateData?.id}
            visible={true}
            onClose={() => {}}
            onClausesChange={handleClausesChange}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <EditOutlined />
          <span>Template Management</span>
          {templateData && (
            <Tag
              color="blue"
              style={{
                marginLeft: "auto",
                marginRight: "50px",
                padding: "10px",
              }}
            >
              {templateData.name || "N/A"} v{templateData.version || "N/A"}
            </Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
      className="contract-preview-modal"
    >
      {templateData ? (
        <div>
          {/* Template Summary */}
          <Card size="small" style={{ marginBottom: "16px" }}>
            <Row gutter={16}>
              <Col span={7}>
                <Text strong>Version: </Text>
                <Tag color="blue">v{templateData.version || "N/A"}</Tag>
              </Col>
              <Col span={7}>
                <Text strong>Co-Owners: </Text>
                <Text>
                  {templateData.minCoOwners || "N/A"}-
                  {templateData.maxCoOwners || "N/A"}
                </Text>
              </Col>
              <Col span={8}>
                <Text strong>Variables: </Text>
                <Tag color="green">{variables.length}</Tag>
                <Text strong>Clauses: </Text>
                <Tag color="orange">{clauses.length}</Tag>
              </Col>
            </Row>
          </Card>

          {/* Tabbed Content */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ minHeight: "500px" }}
          />
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px" }}>
          {loading ? (
            <Text type="secondary">Loading template data...</Text>
          ) : (
            <Text type="secondary">Preparing template...</Text>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ContractPreview;
