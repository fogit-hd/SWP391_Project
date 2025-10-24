/**
 * ==================== BOOKING CONSTANTS ====================
 */

export const BOOKING_STATUS = {
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
  INUSE: 'INUSE',
  OVERTIME: 'OVERTIME',
  COMPLETED: 'COMPLETED',
};

export const BOOKING_STATUS_COLORS = {
  BOOKED: '#1890ff',
  CANCELLED: '#ff4d4f',
  INUSE: '#52c41a',
  OVERTIME: '#faad14',
  COMPLETED: '#8c8c8c',
};

export const BOOKING_STATUS_LABELS = {
  BOOKED: 'Booked',
  CANCELLED: 'Cancelled',
  INUSE: 'In Use',
  OVERTIME: 'Overtime',
  COMPLETED: 'Completed',
};

export const GRACE_WINDOWS = {
  CHECK_IN_BEFORE: 15 * 60 * 1000, 
  CHECK_IN_AFTER: 15 * 60 * 1000,
  CHECK_OUT_AFTER: 15 * 60 * 1000,
};

export const BOOKING_CONSTRAINTS = {
  MIN_ADVANCE_HOURS: 2,
  MAX_ADVANCE_DAYS: 14,
  MAX_DURATION_HOURS: 8,
  MIN_GAP_MINUTES: 30,
};

