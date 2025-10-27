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
      const payload = {
        notes: values.notes || "",
      };

      await api.post(`/booking/check-out/${booking.id}`, payload);
      message.success("Checked out successfully!");
      form.resetFields();
      onComplete();
      onCancel();
    } catch (error) {
      console.error("Check-out failed:", error);
      message.error(error.response?.data?.message || "Failed to check out");
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
        <Form.Item
          name="notes"
          label="Additional Notes (Optional)"
        >
          <TextArea
            rows={4}
            placeholder="Any additional notes about the trip..."
            maxLength={500}
            showCount
          />
        </Form.Item>

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
