import React, { useState } from "react";
import { Modal, Form, Input, Button, message, Space, Alert } from "antd";
import { 
  CheckCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";

const { TextArea } = Input;

const TripScreen = ({ visible, onCancel, booking, onComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCheckOut = async (values) => {
    setLoading(true);
    try {
      console.log("Booking ID:", booking.id);
      console.log("API URL:", `/booking/check-out/${booking.id}`);
      
      // API checkout chỉ cần id, không cần payload
      const response = await api.post(`/booking/check-out/${booking.id}`);
      console.log("Check-out response:", response.data);
      
      message.success("Checked out successfully!");
      form.resetFields();
      onComplete();
      onCancel();
    } catch (error) {
      console.error("Check-out failed:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      
      let errorMsg = "Failed to check out";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined />
          Complete Trip - Check Out
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
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
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ float: 'right' }}>
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
  );
};

export default TripScreen;
