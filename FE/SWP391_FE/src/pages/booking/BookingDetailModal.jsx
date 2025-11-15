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
import { getUserIdFromToken } from "../../components/utils/jwt";

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

      // Check if can cancel - chỉ người tạo booking mới được cancel
      const token = localStorage.getItem("token");
      const currentUserId = getUserIdFromToken(token);
      
      console.log("Cancel check:", {
        bookingStatus: booking.status,
        bookingUserId: booking.userId,
        currentUserId: currentUserId,
        isBefore: now.isBefore(startTime),
        startTime: startTime.format(),
        now: now.format()
      });
      
      // Cho phép cancel nếu:
      // 1. Status là BOOKED (chưa check-in)
      // 2. Là người tạo booking
      // Không kiểm tra thời gian vì nếu status vẫn BOOKED thì chưa bắt đầu sử dụng
      const canCancelNow = 
        booking.status === 'BOOKED' &&
        booking.userId === currentUserId; // Chỉ người tạo booking mới được cancel
      
      console.log("canCancel:", canCancelNow);
      setCanCancel(canCancelNow);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [booking, visible]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/booking/check-in/${booking.id}`);
      
      // Hiển thị message từ backend hoặc message mặc định
      const successMessage = response.data?.message || "Nhận xe thành công!";
      message.success(successMessage);
      
      onUpdate();
      onCancel();
    } catch (error) {
      console.error("Check-in failed:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Không thể nhận xe";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Ưu tiên lấy message từ backend
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Xử lý các lỗi cụ thể
        else if (typeof errorData === 'string') {
          if (errorData.includes("Không tìm thấy")) {
            errorMessage = "Không tìm thấy lịch đặt";
          }
          else if (errorData.includes("trạng thái Booked")) {
            errorMessage = "Chỉ có thể check-in lịch đang ở trạng thái Booked";
          }
          else if (errorData.includes("15 phút trước")) {
            errorMessage = errorData; // Hiển thị đầy đủ thông tin còn bao nhiêu phút
          }
          else if (errorData.includes("trễ quá 15p")) {
            errorMessage = "Check-in thất bại, bạn đã trễ quá 15 phút. Vui lòng đến sớm hơn vào lần sau";
          }
          else if (errorData.includes("chụp ảnh")) {
            errorMessage = "Check-in thất bại, vui lòng chụp ảnh và thử lại";
          }
          else {
            errorMessage = errorData;
          }
        }
      }
      
      message.error({
        content: errorMessage,
        duration: 5
      });
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
      const response = await api.put(`/booking/cancel/${booking.id}`);
      
      // Hiển thị message từ backend (có thể có thông tin về phạt)
      const successMessage = response.data?.message || "Hủy đặt chỗ thành công";
      
      // Kiểm tra nếu có thông tin phạt thì hiển thị warning thay vì success
      if (successMessage.includes("phạt") || successMessage.includes("trễ")) {
        message.warning({
          content: successMessage,
          duration: 5
        });
      } else {
        message.success(successMessage);
      }
      
      onUpdate();
    } catch (error) {
      console.error("Cancel failed:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Không thể hủy đặt chỗ";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Ưu tiên lấy message từ backend
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Xử lý các lỗi cụ thể
        else if (typeof errorData === 'string') {
          if (errorData.includes("Không tìm thấy")) {
            errorMessage = "Không tìm thấy lịch đặt";
          }
          else if (errorData.includes("đã bị hủy")) {
            errorMessage = "Lịch này đã bị hủy trước đó";
          }
          else if (errorData.includes("Huỷ lịch không thành công")) {
            errorMessage = "Không thể hủy lịch đặt này. Vui lòng kiểm tra trạng thái lịch đặt";
          }
          else if (errorData.includes("quota")) {
            errorMessage = "Không thể lấy thông tin quota để hoàn giờ";
          }
          else {
            errorMessage = errorData;
          }
        }
      }
      
      message.error({
        content: errorMessage,
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const isMyBooking = () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = getUserIdFromToken(token);
      const result = booking.userId === currentUserId;
      console.log("isMyBooking check:", {
        bookingUserId: booking.userId,
        currentUserId: currentUserId,
        result: result
      });
      return result;
    } catch (error) {
      console.error("isMyBooking error:", error);
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
            <>
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
              {checkInProgress && checkInProgress.status === 'exception' && (
                <Alert
                  message="Đã hết thời gian nhận xe"
                  description="Xin lỗi anh đã đi trễ quá 15 phút, anh vui lòng đợi hệ thống hủy chuyến và đặt lịch khác. Booking sẽ tự động chuyển sang trạng thái Cancelled sau 5 phút."
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </>
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
            {booking.status !== 'COMPLETE' && booking.status !== 'COMPLETED' && (
              <Descriptions.Item label="Người dùng">
                {booking.userName || ''}
              </Descriptions.Item>
            )}
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
