import React, { useState, useEffect } from "react";
import { Modal, Button, Spin, message, Typography } from "antd";
import { EyeOutlined, CloseOutlined } from "@ant-design/icons";
import api from "../../config/axios";

const { Title, Paragraph } = Typography;

/**
 * ContractHtmlPreview Component
 *
 * A modal component that fetches HTML content from API and renders it
 * with proper styling for contract preview
 */
const ContractHtmlPreview = ({ visible, template, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState(null);

  // Fetch HTML content when modal opens
  useEffect(() => {
    if (visible && template?.id) {
      fetchHtmlContent();
    }
  }, [visible, template]);

  const fetchHtmlContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching HTML content for template:", template.id);

      // Call API to get HTML preview
      const response = await api.get(
        `/contract-templates/${template.id}/preview`
      );

      console.log("Preview API response:", response.data);

      // Extract HTML content from response
      let content = "";
      if (response.data?.content) {
        content = response.data.content;
      } else {
        content = response.data?.data?.content || "";
      }

      setHtmlContent(content);

      if (!content) {
        setError("No HTML content found in response");
        message.warning("No preview content available");
      }
    } catch (error) {
      console.error("Error fetching HTML content:", error);
      setError(error.message);
      message.error("Failed to load contract preview");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHtmlContent("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <EyeOutlined />
          <span>Contract Preview - {template?.name || "Template"}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={handleClose} icon={<CloseOutlined />}>
          Close
        </Button>,
      ]}
      className="contract-html-preview-modal"
    >
      <div style={{ minHeight: "400px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <Spin size="large" />
            <span style={{ marginLeft: "16px" }}>Loading preview...</span>
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#ff4d4f",
            }}
          >
            <Title level={4} type="danger">
              Preview Error
            </Title>
            <Paragraph>{error}</Paragraph>
            <Button type="primary" onClick={fetchHtmlContent}>
              Retry
            </Button>
          </div>
        ) : htmlContent ? (
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              padding: "20px",
              backgroundColor: "#fafafa",
              minHeight: "400px",
              maxHeight: "600px",
              overflowY: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#999",
            }}
          >
            <Title level={4}>No Preview Available</Title>
            <Paragraph>This template has no preview content.</Paragraph>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ContractHtmlPreview;
