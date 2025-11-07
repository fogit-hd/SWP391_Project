import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Space, Alert } from "antd";
import { 
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";

const { TextArea } = Input;

const TripScreen = ({ visible, onCancel, booking, onComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [overtimeInfo, setOvertimeInfo] = useState(null);

  // Tính toán thông tin checkout trễ
  useEffect(() => {
    if (!booking || !visible) return;

    const calculateOvertime = () => {
      const now = dayjs();
      const endTime = dayjs(booking.endTime);
      const overtimeMinutes = now.diff(endTime, 'minute', true);

      if (overtimeMinutes <= 5) {
        setOvertimeInfo(null); // Không trễ hoặc trong vùng an toàn
      } else if (overtimeMinutes > 5 && overtimeMinutes < 15) {
        setOvertimeInfo({
          type: 'warning',
          minutes: overtimeMinutes,
          penalty: 'Cảnh báo: Checkout trễ nhưng chưa bị phạt',
          message: 'Bạn đang checkout trễ, vui lòng checkout sớm hơn vào lần sau.'
        });
      } else if (overtimeMinutes >= 15 && overtimeMinutes <= 30) {
        setOvertimeInfo({
          type: 'error',
          minutes: overtimeMinutes,
          penalty: 'Phạt: 30 phút sử dụng xe',
          message: `Checkout trễ ${overtimeMinutes.toFixed(0)} phút. Bạn sẽ bị trừ 30 phút (0.5 giờ) quota sử dụng xe.`
        });
      } else if (overtimeMinutes > 30 && overtimeMinutes < 60) {
        setOvertimeInfo({
          type: 'error',
          minutes: overtimeMinutes,
          penalty: 'Phạt: 1 giờ sử dụng xe',
          message: `Checkout trễ ${overtimeMinutes.toFixed(0)} phút. Bạn sẽ bị trừ 1 giờ quota sử dụng xe.`
        });
      } else {
        const overtimeHours = overtimeMinutes / 60;
        const penaltyHours = (overtimeHours * 4).toFixed(1);
        setOvertimeInfo({
          type: 'error',
          minutes: overtimeMinutes,
          penalty: `Phạt: ${penaltyHours} giờ sử dụng xe`,
          message: `Checkout trễ ${overtimeMinutes.toFixed(0)} phút (${overtimeHours.toFixed(1)} giờ). Bạn sẽ bị trừ ${penaltyHours} giờ quota (phạt gấp 4 lần).`
        });
      }
    };

    calculateOvertime();
    const interval = setInterval(calculateOvertime, 60000); // Update mỗi phút
    return () => clearInterval(interval);
  }, [booking, visible]);

  const handleCheckOut = async (values) => {
    setLoading(true);
    try {
      console.log("Booking ID:", booking.id);
      
      const response = await api.post(`/booking/check-out/${booking.id}`);
      console.log("Check-out response:", response.data);
      
      // Hiển thị message từ backend
      const backendMessage = response.data?.message || response.data;
      
      console.log("Backend message:", backendMessage);
      console.log("Message type check:", {
        hasPhạt: backendMessage.includes("phạt"),
        hasTrễ: backendMessage.includes("trễ"),
        hasSớm: backendMessage.includes("sớm")
      });
      
      // Phân loại message dựa vào nội dung - cải thiện logic
      if (backendMessage && typeof backendMessage === 'string') {
        const lowerMessage = backendMessage.toLowerCase();
        
        if (lowerMessage.includes("trễ") || lowerMessage.includes("phạt") || lowerMessage.includes("penalty")) {
          // Thông báo checkout trễ - hiển thị với icon warning và thời gian dài hơn
          message.warning({
            content: backendMessage,
            duration: 6,
            icon: <WarningOutlined />,
            style: { fontSize: '15px' }
          });
        } else if (lowerMessage.includes("sớm")) {
          // Thông báo checkout sớm
          message.success({
            content: backendMessage,
            duration: 4
          });
        } else {
          // Checkout đúng giờ
          message.success({
            content: backendMessage,
            duration: 4
          });
        }
      } else {
        // Fallback nếu không có message
        message.success("Trả xe thành công!");
      }
      
      form.resetFields();
      onComplete();
      onCancel();
    } catch (error) {
      console.error("Check-out failed:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMsg = "Không thể trả xe";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        // Ưu tiên message từ backend
        errorMsg = errorData.message || errorData.error || errorData;
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
          Hoàn thành chuyến đi - Trả xe
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      <Alert
        message="Tóm tắt chuyến đi"
        description={
          <div>
            <p><strong>Bắt đầu:</strong> {dayjs(booking.startTime).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>Kết thúc:</strong> {dayjs(booking.endTime).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>Thời lượng:</strong> {dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true).toFixed(1)} giờ</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Hiển thị cảnh báo phạt nếu checkout trễ */}
      {overtimeInfo && (
        <Alert
          message={overtimeInfo.penalty}
          description={
            <div>
              <p><ClockCircleOutlined /> {overtimeInfo.message}</p>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                <strong>Quy định phạt checkout trễ:</strong>
              </p>
              <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                <li>Trễ 5-15 phút: Cảnh báo (chưa phạt)</li>
                <li>Trễ 15-30 phút: Phạt 30 phút quota</li>
                <li>Trễ 30-60 phút: Phạt 1 giờ quota</li>
                <li>Trễ trên 1 giờ: Phạt gấp 4 lần thời gian trễ</li>
              </ul>
            </div>
          }
          type={overtimeInfo.type}
          showIcon
          icon={overtimeInfo.type === 'error' ? <WarningOutlined /> : <ClockCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleCheckOut}
      >
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ float: 'right' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              Hoàn tất trả xe
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TripScreen;
