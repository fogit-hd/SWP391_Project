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
      message.success("Checked in successfully!");
      onUpdate();
      onCancel();
    } catch (error) {
      console.error("Check-in failed:", error);
      message.error(error.response?.data?.message || "Failed to check in");
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
      message.success("Booking cancelled successfully");
      onUpdate();
    } catch (error) {
      console.error("Cancel failed:", error);
      message.error(error.response?.data?.message || "Failed to cancel booking");
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

  const getCheckInProgress = () => {
    const now = dayjs();
    const startTime = dayjs(booking.startTime);
    const windowStart = startTime.subtract(GRACE_WINDOWS.CHECK_IN_BEFORE, 'millisecond');
    const windowEnd = startTime.add(GRACE_WINDOWS.CHECK_IN_AFTER, 'millisecond');
    
    if (now.isBefore(windowStart)) {
      return { percent: 0, status: 'normal', text: 'Too early to check-in' };
    }
    if (now.isAfter(windowEnd)) {
      return { percent: 100, status: 'exception', text: 'Check-in window closed' };
    }
    
    const totalWindow = windowEnd.diff(windowStart);
    const elapsed = now.diff(windowStart);
    const percent = (elapsed / totalWindow) * 100;
    
    return { percent, status: 'active', text: 'Check-in available!' };
  };

  const checkInProgress = booking.status === 'BOOKED' ? getCheckInProgress() : null;

  return (
    <>
      <Modal
        title={
          <Space>
            <CarOutlined />
            Booking Details
          </Space>
        }
        open={visible && !tripScreenVisible}
        onCancel={onCancel}
        width={700}
        footer={
          isMyBooking() ? (
            <Space>
              <Button onClick={onCancel}>Close</Button>
              {canCancel && (
                <Popconfirm
                  title="Cancel Booking"
                  description="Are you sure you want to cancel this booking?"
                  onConfirm={handleCancel}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />} loading={loading}>
                    Cancel Booking
                  </Button>
                </Popconfirm>
              )}
              {canCheckIn && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckIn}
                  loading={loading}
                >
                  Check In
                </Button>
              )}
              {canCheckOut && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckOut}
                  loading={loading}
                >
                  Check Out
                </Button>
              )}
            </Space>
          ) : (
            <Button onClick={onCancel}>Close</Button>
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
                  Time until start: {countdown}
                </Space>
              }
              type={canCheckIn ? "success" : "info"}
              showIcon
            />
          )}

          {booking.status === 'INUSE' && isMyBooking() && (
            <Alert
              message="Trip in progress"
              description={canCheckOut ? "You can check out now" : "Please check out after the scheduled end time"}
              type={canCheckOut ? "success" : "warning"}
              showIcon
            />
          )}

          {booking.status === 'OVERTIME' && isMyBooking() && (
            <Alert
              message="Overtime - Please check out immediately!"
              description="You have exceeded your booking time. Additional charges may apply."
              type="error"
              showIcon
            />
          )}

          {/* Check-in Progress */}
          {checkInProgress && isMyBooking() && booking.status === 'BOOKED' && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Check-in Window:</strong>
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
            <Descriptions.Item label="Status">
              <Tag color={BOOKING_STATUS_COLORS[booking.status]}>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {booking.userName || 'Unknown'}
              {isMyBooking() && <Tag color="green" style={{ marginLeft: 8 }}>You</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {dayjs(booking.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Time">
              {dayjs(booking.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true).toFixed(1)} hours
            </Descriptions.Item>
            {booking.notes && (
              <Descriptions.Item label="Notes">
                {booking.notes}
              </Descriptions.Item>
            )}
            {booking.checkInTime && (
              <Descriptions.Item label="Check-in Time">
                {dayjs(booking.checkInTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {booking.checkOutTime && (
              <Descriptions.Item label="Check-out Time">
                {dayjs(booking.checkOutTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {booking.damageReport && (
              <Descriptions.Item label="Damage Report">
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
