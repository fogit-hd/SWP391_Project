import React, { useState } from "react";
import { Modal, Form, Input, Upload, Button, message, Space, Alert, Divider } from "antd";
import { 
  CameraOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  PlusOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";
import DamageReport from "./DamageReport";

const { TextArea } = Input;

const TripScreen = ({ visible, onCancel, booking, onComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [hasDamage, setHasDamage] = useState(false);

  const handleCheckOut = async (values) => {
    setLoading(true);
    try {
      // Upload photos if any
      let photoUrls = [];
      if (fileList.length > 0) {
        // If you have a photo upload API, use it here
        // For now, we'll store the base64 or file references
        photoUrls = fileList.map(file => file.thumbUrl || file.url || '');
      }

      const payload = {
        photos: photoUrls,
        damageReport: values.damageReport || "",
        notes: values.notes || "",
      };

      await api.put(`/booking/check-out/${booking.id}`, payload);
      message.success("Checked out successfully!");
      form.resetFields();
      setFileList([]);
      onComplete();
    } catch (error) {
      console.error("Check-out failed:", error);
      message.error(error.response?.data?.message || "Failed to check out");
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  const handlePreview = async (file) => {
    setPreviewImage(file.thumbUrl || file.url);
    setPreviewVisible(true);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return false; // Prevent auto upload
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            Complete Trip - Check Out
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        width={700}
        footer={null}
      >
        <Alert
          message="Trip Summary"
          description={
            <div>
              <p><strong>Start:</strong> {dayjs(booking.startTime).format('YYYY-MM-DD HH:mm')}</p>
              <p><strong>End:</strong> {dayjs(booking.endTime).format('YYYY-MM-DD HH:mm')}</p>
              <p><strong>Duration:</strong> {dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true).toFixed(1)} hours</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCheckOut}
        >
          <Divider>Vehicle Condition Photos (Optional)</Divider>
          
          <Form.Item label="Upload Photos of Vehicle Condition">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              beforeUpload={beforeUpload}
              multiple
            >
              {fileList.length >= 8 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Divider>Damage Report</Divider>

          <DamageReport
            onDamageChange={(hasDamage) => setHasDamage(hasDamage)}
            form={form}
          />

          <Form.Item
            name="notes"
            label="Additional Notes (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Any additional notes about the trip..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={onCancel}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Complete Check-Out
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default TripScreen;
