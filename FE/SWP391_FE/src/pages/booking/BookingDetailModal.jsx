import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Tag, Button, Space, Alert, Progress, Popconfirm, Form, DatePicker } from "antd";
import { toast } from "react-toastify";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CarOutlined,
  DeleteOutlined,
  EditOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";
import TripScreen from "./TripScreen";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, GRACE_WINDOWS, BOOKING_CONSTRAINTS } from "./booking.types";
import { useAuth } from "../../components/hooks/useAuth";
import { getUserIdFromToken } from "../../components/utils/jwt";
// All role and user checks rely on useAuth (which is backed by JWT utils)

const ACTIVE_BOOKING_STATUSES = ["BOOKED", "INUSE", "IN USE", "OVERTIME"];

const BookingDetailModal = ({ visible, onCancel, booking, onUpdate, groupId, vehicleId, existingBookings = [] }) => {
  const { isCoOwner, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const [tripScreenVisible, setTripScreenVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [validationError, setValidationError] = useState(null);
  const { RangePicker } = DatePicker;

  const getCurrentUserId = () => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        console.log('[getCurrentUserId] No userData in localStorage');
        return null;
      }
      
      const userData = JSON.parse(userDataStr);
      const token = userData?.data?.accessToken;
      
      if (!token) {
        console.log('[getCurrentUserId] No accessToken found in userData');
        return null;
      }
      
      const userId = getUserIdFromToken(token);
      console.log('[getCurrentUserId] Extracted userId from JWT:', userId);
      return userId;
    } catch (error) {
      console.error('[getCurrentUserId] Error extracting user ID:', error);
      return null;
    }
  };

  const isMyBooking = () => {
    if (!booking) return false;
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return false;

    const result = booking.userId === currentUserId;
    console.log("isMyBooking check:", { bookingUserId: booking.userId, currentUserId, result });

    return result;
  };

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
      const currentUserId = getCurrentUserId();
      const canCancelNow = 
        booking.status === 'BOOKED' &&
        currentUserId &&
        booking.userId === currentUserId; // Chỉ người tạo booking mới được cancel
      
      console.log("Cancel check:", {
        bookingStatus: booking.status,
        bookingUserId: booking.userId,
        currentUserId,
        isBefore: now.isBefore(startTime),
        startTime: startTime.format(),
        now: now.format()
      });
      
      // Cho phép cancel nếu:
      // 1. Status là BOOKED (chưa check-in)
      // 2. Là người tạo booking
      // Không kiểm tra thời gian vì nếu status vẫn BOOKED thì chưa bắt đầu sử dụng
      setCanCancel(canCancelNow);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [booking, visible, user]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/booking/check-in/${booking.id}`);
      
      // Hiển thị message từ backend hoặc message mặc định
      const successMessage = response.data?.message || "Nhận xe thành công!";
      toast.success(successMessage);
      
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
      
      toast.error(errorMessage, { autoClose: 6000 });
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

  const handleOpenUpdateModal = () => {
    updateForm.setFieldsValue({
      timeRange: [dayjs(booking.startTime), dayjs(booking.endTime)]
    });
    setValidationError(null);
    setUpdateModalVisible(true);
  };

  const disabledDate = (current) => {
    if (!current) return false;
    
    const now = dayjs();
    const maxDate = dayjs().add(BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS, 'day');
    return current < now.startOf('day') || current > maxDate.endOf('day');
  };

  const disabledTime = (current, type) => {
    const now = dayjs();
    const minAllowedTime = now.add(BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES, 'minute');
    
    if (!current || !type) {
      return {};
    }

    const selectedDate = dayjs(current);

    // Xử lý cho start time
    if (type === 'start') {
      if (selectedDate.isSame(now, 'day')) {
        const minHour = minAllowedTime.hour();
        const minMinute = minAllowedTime.minute();
        
        return {
          disabledHours: () => {
            const hours = [];
            for (let i = 0; i < minHour; i++) {
              hours.push(i);
            }
            return hours;
          },
          disabledMinutes: (selectedHour) => {
            if (selectedHour === minHour) {
              const minutes = [];
              for (let i = 0; i < minMinute; i++) {
                minutes.push(i);
              }
              return minutes;
            }
            return [];
          },
          disabledSeconds: () => [],
        };
      }
    }
    
    // Xử lý cho end time
    if (type === 'end') {
      const timeRange = updateForm.getFieldValue('timeRange');
      const startTime = timeRange && timeRange[0] ? dayjs(timeRange[0]) : null;
      
      if (!startTime) {
        if (selectedDate.isSame(now, 'day')) {
          const minHour = minAllowedTime.hour();
          const minMinute = minAllowedTime.minute();
          
          return {
            disabledHours: () => {
              const hours = [];
              for (let i = 0; i < minHour; i++) {
                hours.push(i);
              }
              return hours;
            },
            disabledMinutes: (selectedHour) => {
              if (selectedHour === minHour) {
                const minutes = [];
                for (let i = 0; i < minMinute; i++) {
                  minutes.push(i);
                }
                return minutes;
              }
              return [];
            },
            disabledSeconds: () => [],
          };
        }
      } else {
        if (selectedDate.isSame(startTime, 'day')) {
          const startHour = startTime.hour();
          const startMinute = startTime.minute();
          
          return {
            disabledHours: () => {
              const hours = [];
              for (let i = 0; i <= startHour; i++) {
                hours.push(i);
              }
              return hours;
            },
            disabledMinutes: (selectedHour) => {
              if (selectedHour === startHour + 1) {
                const minutes = [];
                for (let i = 0; i <= startMinute; i++) {
                  minutes.push(i);
                }
                return minutes;
              }
              return [];
            },
            disabledSeconds: () => [],
          };
        }
      }
    }
    
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
      disabledSeconds: () => [],
    };
  };

  const validateUpdateTime = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      return { valid: false, error: "Vui lòng chọn thời gian bắt đầu và kết thúc" };
    }

    const now = dayjs();
    const start = dates[0];
    const end = dates[1];

    // Check minimum advance booking (phải đặt trước ít nhất 15 phút)
    const minAllowedTime = now.add(BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES, 'minute');
    
    if (start.isBefore(minAllowedTime)) {
      return { 
        valid: false, 
        error: `Thời gian bắt đầu phải cách thời gian hiện tại ít nhất ${BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES} phút` 
      };
    }

    // Check maximum advance booking (14 ngày)
    const daysUntilStart = start.diff(now, 'day', true);
    if (daysUntilStart > BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS) {
      return { 
        valid: false, 
        error: `Chỉ có thể đặt trong tuần này và tuần sau (không quá ${BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} ngày)` 
      };
    }

    // Check basic duration validity
    const duration = end.diff(start, 'hour', true);
    if (duration <= 0) {
      return { valid: false, error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
    }

    // Check for overlapping bookings (exclude current booking being updated)
    const minGapMinutes = BOOKING_CONSTRAINTS.MIN_GAP_MINUTES;
    const conflictBooking = existingBookings.find(existingBooking => {
      const normalizedStatus = (existingBooking.status || "")
        .toString()
        .toUpperCase();
      // Skip inactive bookings and the current booking being edited
      if (!ACTIVE_BOOKING_STATUSES.includes(normalizedStatus) || existingBooking.id === booking.id) {
        return false;
      }
      
      const bookingStart = dayjs(existingBooking.startTime);
      const bookingEnd = dayjs(existingBooking.endTime);
      
      // Kiểm tra overlap trực tiếp
      const hasOverlap = (start.isBefore(bookingEnd) && end.isAfter(bookingStart)) ||
        (start.isSame(bookingStart) || end.isSame(bookingEnd));
      
      if (hasOverlap) {
        return true;
      }
      
      // Kiểm tra khoảng cách tối thiểu 30 phút
      if (end.isBefore(bookingStart) || end.isSame(bookingStart)) {
        const gapMinutes = bookingStart.diff(end, 'minute', true);
        if (gapMinutes < minGapMinutes) {
          return true;
        }
      }
      
      if (start.isAfter(bookingEnd) || start.isSame(bookingEnd)) {
        const gapMinutes = start.diff(bookingEnd, 'minute', true);
        if (gapMinutes < minGapMinutes) {
          return true;
        }
      }
      
      return false;
    });

    if (conflictBooking) {
      return { 
        valid: false, 
        error: `Thời gian đặt phải cách các booking khác ít nhất ${minGapMinutes} phút` 
      };
    }

    return { valid: true };
  };

  const handleUpdateBooking = async (values) => {
    const { timeRange } = values;
    
    // Validate trước khi gửi
    const validation = validateUpdateTime(timeRange);
    if (!validation.valid) {
      setValidationError(validation.error);
      toast.error(validation.error);
      return;
    }

    setValidationError(null);
    setLoading(true);
    try {
      const payload = {
        id: booking.id,
        startTime: timeRange[0].format('YYYY-MM-DDTHH:mm:ss.SSS'),
        endTime: timeRange[1].format('YYYY-MM-DDTHH:mm:ss.SSS')
      };

      const response = await api.put('/booking/update', payload);
      
      const successMessage = response.data?.message || "Cập nhật đặt lịch thành công!";
      toast.success(successMessage);
      
      setUpdateModalVisible(false);
      updateForm.resetFields();
      onUpdate();
    } catch (error) {
      console.error("Update booking failed:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Không thể cập nhật đặt lịch";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          } else if (typeof errorData.errors === 'object') {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => {
                const messageArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messageArray.join(", ")}`;
              })
              .join("\n");
            errorMessage = errorMessages;
          }
        }
      }
      
      toast.error(errorMessage, { autoClose: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/booking/cancel/${booking.id}`);
      
      // Hiển thị message từ backend (có thể có thông tin về phạt)
      const successMessage = response.data?.message || "Hủy đặt lịch thành công";
      
      // Kiểm tra nếu có thông tin phạt thì hiển thị warning thay vì success
      if (successMessage.includes("phạt") || successMessage.includes("trễ")) {
        toast.warning(successMessage, { autoClose: 5000 });
      } else {
        toast.success(successMessage);
      }
      
      onUpdate();
    } catch (error) {
      console.error("Cancel failed:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Không thể hủy đặt lịch";
      
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
      
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

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
            Chi tiết đặt lịch
          </Space>
        }
        open={visible && !tripScreenVisible}
        onCancel={onCancel}
        width={700}
        footer={
          isMyBooking() ? (
            <Space>
              <Button onClick={onCancel}>Đóng</Button>
              {(booking.status === 'BOOKED' || booking.status === 'INUSE') && (
                <Button 
                  icon={<EditOutlined />}
                  onClick={handleOpenUpdateModal}
                  loading={loading}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canCancel && (
                <Popconfirm
                  title="Hủy đặt lịch"
                  description="Bạn có chắc chắn muốn hủy đặt lịch này không?"
                  onConfirm={handleCancel}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button danger icon={<DeleteOutlined />} loading={loading}>
                    Hủy đặt lịch
                  </Button>
                </Popconfirm>
              )}
              {canCheckIn && !isCoOwner && (
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckIn}
                  loading={loading}
                >
                  Nhận xe
                </Button>
              )}
              {canCheckOut && !isCoOwner && (
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
              {(() => {
                const totalMinutes = dayjs(booking.endTime).diff(dayjs(booking.startTime), 'minute');
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${hours}h ${minutes}m`;
              })()}
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

      <Modal
        title="Chỉnh sửa đặt lịch"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          updateForm.resetFields();
          setValidationError(null);
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Quy tắc cập nhật đặt lịch"
          description={
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Đặt trước thời gian hiện tại ít nhất {BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES} phút</li>
              <li>Chỉ có thể đặt trong tuần này và tuần sau (không quá {BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} ngày)</li>
              <li>Phải cách các booking khác ít nhất {BOOKING_CONSTRAINTS.MIN_GAP_MINUTES} phút</li>
              <li>Không được trùng với các đặt lịch hiện có</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {validationError && (
          <Alert
            message="Lỗi xác thực"
            description={validationError}
            type="error"
            showIcon
            closable
            onClose={() => setValidationError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleUpdateBooking}
        >
          <Form.Item
            name="timeRange"
            label="Thời gian đặt lịch"
            rules={[{ required: true, message: "Vui lòng chọn thời gian đặt lịch" }]}
          >
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              minuteStep={1}
              disabledDate={disabledDate}
              disabledTime={disabledTime}
              onChange={(dates) => {
                setValidationError(null);
                if (dates && dates[0] && dates[1]) {
                  const validation = validateUpdateTime(dates);
                  if (!validation.valid) {
                    setValidationError(validation.error);
                  }
                }
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button 
                onClick={() => {
                  setUpdateModalVisible(false);
                  updateForm.resetFields();
                  setValidationError(null);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
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
