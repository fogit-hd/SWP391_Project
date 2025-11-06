/**
 * ==================== BOOKING CONSTANTS ====================
 */

export const BOOKING_STATUS = {
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
  INUSE: 'IN USE',
  OVERTIME: 'OVERTIME',
  COMPLETE: 'COMPLETE', 
};

export const BOOKING_STATUS_COLORS = {
  BOOKED: '#1890ff',
  CANCELLED: '#ff4d4f',
  INUSE: '#52c41a',
  OVERTIME: '#faad14',
  COMPLETE: '#52c41a', 
};

export const BOOKING_STATUS_LABELS = {
  BOOKED: 'Booked',
  CANCELLED: 'Cancelled',
  INUSE: 'In Use',
  OVERTIME: 'Overtime',
  COMPLETE: 'Completed', 
};

export const GRACE_WINDOWS = {
  CHECK_IN_BEFORE: 15 * 60 * 1000, 
  CHECK_IN_AFTER: 15 * 60 * 1000,
  CHECK_OUT_AFTER: 15 * 60 * 1000,
};

export const BOOKING_CONSTRAINTS = {
  MIN_ADVANCE_MINUTES: 15, // Đặt trước thời gian hiện tại ít nhất 15 phút
  MAX_ADVANCE_DAYS: 14, // Chỉ có thể đặt trong tuần này và tuần sau (14 ngày)
  MAX_DURATION_HOURS: 8,
  MIN_GAP_MINUTES: 30, // Thời gian mỗi lần đặt cách nhau ít nhất 30 phút
};

