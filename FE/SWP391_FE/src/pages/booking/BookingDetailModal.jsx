import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Tag, Button, Space, message, Alert, Progress, Popconfirm } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CarOutlined,
  DeleteOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";
import TripScreen from "./TripScreen";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, GRACE_WINDOWS } from "./booking.types";

const BookingDetailModal = ({ visible, onCancel, booking, onUpdate, groupId, vehicleId }) => {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const [tripScreenVisible, setTripScreenVisible] = useState(false);

  useEffect(() => {
    if (!booking || !visible) return;

    const updateStatus = () => {
      const now = dayjs();
      const startTime = dayjs(booking.startTime);
      const endTime = dayjs(booking.endTime);

      // Calculate countdown to start
      const msUntilStart = startTime.diff(now);
      if (msUntilStart > 0) {
        const hours = Math.floor(msUntilStart / (1000 * 60 * 60));
        const minutes = Math.floor((msUntilStart % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msUntilStart % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown("Started");
      }

      // Check if can check-in
      const canCheckInNow = 
        booking.status === 'BOOKED' &&
        msUntilStart <= GRACE_WINDOWS.CHECK_IN_BEFORE &&
        msUntilStart >= -GRACE_WINDOWS.CHECK_IN_AFTER;
      setCanCheckIn(canCheckInNow);

      // Check if can check-out
      const canCheckOutNow = 
        (booking.status === 'INUSE' || booking.status === 'OVERTIME') &&
        now.isAfter(endTime);
      setCanCheckOut(canCheckOutNow);

      // Check if can cancel
      const canCancelNow = 
        booking.status === 'BOOKED' &&
        now.isBefore(startTime);
      setCanCancel(canCancelNow);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [booking, visible]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.put(`/booking/check-in/${booking.id}`);
      message.success("Nhận xe thành công!");
      onUpdate();
      onCancel();
    } catch (error) {
      console.error("Check-in failed:", error);
      message.error(error.response?.data?.message || "Không thể nhận xe");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = () => {
    setTripScreenVisible(true);
  };

  const handleTripComplete = () => {
    setTripScreenVisible(false);
    onUpdate();
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.put(`/booking/cancel/${booking.id}`);
      message.success("Hủy đặt chỗ thành công");
      onUpdate();
    } catch (error) {
      console.error("Cancel failed:", error);
      message.error(error.response?.data?.message || "Không thể hủy đặt chỗ");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const isMyBooking = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      return booking.userId === (userData.id || userData.userId);
    } catch {
      return false;
    }
  };

  const isCoOwner = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      return userData.roleId === 3; // Role 3 = CoOwner
    } catch {
      return false;
    }
  };

  const getCheckInProgress = () => {
    const now = dayjs();
    const startTime = dayjs(booking.startTime);
    const windowStart = startTime.subtract(GRACE_WINDOWS.CHECK_IN_BEFORE, 'millisecond');
    const windowEnd = startTime.add(GRACE_WINDOWS.CHECK_IN_AFTER, 'millisecond');
    
    if (now.isBefore(windowStart)) {
      return { percent: 0, status: 'normal', text: 'Quá sớm để nhận xe' };
    }
    if (now.isAfter(windowEnd)) {
      return { percent: 100, status: 'exception', text: 'Đã hết thời gian nhận xe' };
    }
    
    const totalWindow = windowEnd.diff(windowStart);
    const elapsed = now.diff(windowStart);
    const percent = (elapsed / totalWindow) * 100;
    
    return { percent, status: 'active', text: 'Có thể nhận xe!' };
  };

  const checkInProgress = booking.status === 'BOOKED' ? getCheckInProgress() : null;

  return (
    <>
      <Modal
        title={
          <Space>
            <CarOutlined />
            Chi tiết đặt chỗ
          </Space>
        }
        open={visible && !tripScreenVisible}
        onCancel={onCancel}
        width={700}
        footer={
          isMyBooking() ? (
            <Space>
              <Button onClick={onCancel}>Đóng</Button>
              {canCancel && (
                <Popconfirm
                  title="Hủy đặt chỗ"
                  description="Bạn có chắc chắn muốn hủy đặt chỗ này không?"
                  onConfirm={handleCancel}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button danger icon={<DeleteOutlined />} loading={loading}>
                    Hủy đặt chỗ
                  </Button>
                </Popconfirm>
              )}
              {canCheckIn && !isCoOwner() && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckIn}
                  loading={loading}
                >
                  Nhận xe
                </Button>
              )}
              {canCheckOut && !isCoOwner() && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckOut}
                  loading={loading}
                >
                  Trả xe
                </Button>
              )}
            </Space>
          ) : (
            <Button onClick={onCancel}>Đóng</Button>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Status Alert */}
          {booking.status === 'BOOKED' && isMyBooking() && (
            <Alert
              message={
                <Space>
                  <ClockCircleOutlined />
                  Thời gian đến lúc bắt đầu: {countdown}
                </Space>
              }
              type={canCheckIn ? "success" : "info"}
              showIcon
            />
          )}

          {booking.status === 'INUSE' && isMyBooking() && (
            <Alert
              message="Chuyến đi đang diễn ra"
              description={canCheckOut ? "Bạn có thể trả xe ngay bây giờ" : "Vui lòng trả xe sau thời gian kết thúc đã định"}
              type={canCheckOut ? "success" : "warning"}
              showIcon
            />
          )}

          {booking.status === 'OVERTIME' && isMyBooking() && (
            <Alert
              message="Quá giờ - Vui lòng trả xe ngay lập tức!"
              description="Bạn đã vượt quá thời gian đặt xe. Phí bổ sung có thể được áp dụng."
              type="error"
              showIcon
            />
          )}

          {/* Check-in Progress */}
          {checkInProgress && isMyBooking() && booking.status === 'BOOKED' && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Thời gian nhận xe:</strong>
              </div>
              <Progress
                percent={Math.round(checkInProgress.percent)}
                status={checkInProgress.status}
                format={() => checkInProgress.text}
              />
            </div>
          )}

          {/* Booking Information */}
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Trạng thái">
              <Tag color={BOOKING_STATUS_COLORS[booking.status]}>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người dùng">
              {booking.userName || ''}
              {isMyBooking() && <Tag color="green" style={{ marginLeft: 8 }}>Bạn</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian bắt đầu">
              {dayjs(booking.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian kết thúc">
              {dayjs(booking.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng">
              {dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true).toFixed(1)} giờ
            </Descriptions.Item>
            {booking.notes && (
              <Descriptions.Item label="Ghi chú">
                {booking.notes}
              </Descriptions.Item>
            )}
            {booking.checkInTime && (
              <Descriptions.Item label="Thời gian nhận xe">
                {dayjs(booking.checkInTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {booking.checkOutTime && (
              <Descriptions.Item label="Thời gian trả xe">
                {dayjs(booking.checkOutTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {booking.damageReport && (
              <Descriptions.Item label="Báo cáo hư hỏng">
                <Alert message={booking.damageReport} type="warning" />
              </Descriptions.Item>
            )}
          </Descriptions>
        </Space>
      </Modal>

      {tripScreenVisible && (
        <TripScreen
          visible={tripScreenVisible}
          onCancel={() => setTripScreenVisible(false)}
          booking={booking}
          onComplete={handleTripComplete}
        />
      )}
    </>
  );
};

export default BookingDetailModal;
