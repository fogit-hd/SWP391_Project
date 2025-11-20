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
  BOOKED: '#69c0ff',    
  CANCELLED: '#ff7875', 
  INUSE: '#ffc53d',     
  OVERTIME: '#b37feb', 
  COMPLETE: '#95de64',  
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
  MIN_ADVANCE_MINUTES: 15, 
  MAX_ADVANCE_DAYS: 14, 
  MAX_DURATION_HOURS: 8,
  MIN_GAP_MINUTES: 30, 
};

