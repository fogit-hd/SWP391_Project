import React, { useState, useEffect } from "react";
import { Modal, Form, DatePicker, Input, Button, message, Alert, List } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";
import { BOOKING_CONSTRAINTS } from "./booking.types";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CreateBookingModal = ({ visible, onCancel, onSuccess, groupId, vehicleId, existingBookings = [] }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  // State để lưu tạm raw bookings data
  const [rawBookings, setRawBookings] = useState([]);

  // Fetch quota information and completed bookings when modal opens
  React.useEffect(() => {
    if (visible && groupId && vehicleId) {
      fetchQuotaInfo();
      fetchCompletedBookings();
    }
  }, [visible, groupId, vehicleId]);

  const fetchQuotaInfo = async () => {
    if (!groupId || !vehicleId) return;
    
    setQuotaLoading(true);
    try {
      const response = await api.get(`/quota/check/${groupId}/${vehicleId}`);
      setQuotaInfo(response.data);
    } catch (error) {
      console.error("Failed to fetch quota info:", error);
      message.error("Failed to load booking quota information");
    } finally {
      setQuotaLoading(false);
    }
  };

  const fetchCompletedBookings = async () => {
    if (!groupId || !vehicleId) return;
    
    setBookingsLoading(true);
    try {
      const response = await api.get(`/booking/Get-Booking-by-group-and-vehicle/${groupId}/${vehicleId}`);
      const allBookings = response.data.data || [];
      
      console.log('Fetched raw bookings:', allBookings);
      // Lưu raw bookings để filter sau khi có quotaInfo
      setRawBookings(allBookings);
      
      // Nếu đã có quotaInfo thì filter ngay
      if (quotaInfo?.data?.weekStartDate) {
        filterCurrentWeekBookings(allBookings);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      message.error("Failed to load completed bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  const filterCurrentWeekBookings = (allBookings) => {
    console.log('=== DEBUG filterCurrentWeekBookings ===');
    console.log('All bookings:', allBookings);
    console.log('Current quotaInfo:', quotaInfo);
    
    // Chỉ filter khi đã có thông tin quota với weekStartDate
    if (!quotaInfo?.data?.weekStartDate) {
      console.log('No quota weekStartDate available yet, skipping filter');
      return;
    }
    
    const weekStartDate = dayjs(quotaInfo.data.weekStartDate);
    console.log('Using quota weekStartDate:', weekStartDate.format('YYYY-MM-DD'));
    
    const weekEndDate = weekStartDate.add(7, 'day');
    console.log('Week range:', weekStartDate.format('YYYY-MM-DD'), 'to', weekEndDate.format('YYYY-MM-DD'));
    
    const currentWeekCompleted = allBookings.filter(booking => {
      console.log('Checking booking:', booking.id, booking.status, booking.startTime);
      if (booking.status !== 'COMPLETE') {
        console.log('Skipping - status is not COMPLETE:', booking.status);
        return false;
      }
      
      const startTime = dayjs(booking.startTime);
      // Sử dụng isSame hoặc isAfter thay vì isSameOrAfter
      const isInRange = (startTime.isAfter(weekStartDate) || startTime.isSame(weekStartDate)) && startTime.isBefore(weekEndDate);
      console.log('Booking startTime:', startTime.format('YYYY-MM-DD HH:mm'), 'isInRange:', isInRange);
      return isInRange;
    });

    console.log('Filtered completed bookings:', currentWeekCompleted);
    setCompletedBookings(currentWeekCompleted);
  };

  // Cập nhật lại completed bookings khi quotaInfo thay đổi
  React.useEffect(() => {
    if (quotaInfo?.data?.weekStartDate && rawBookings.length > 0) {
      // Filter lại bookings với thông tin tuần chính xác từ quota
      console.log('Re-filtering bookings with quota info');
      filterCurrentWeekBookings(rawBookings);
    }
  }, [quotaInfo, rawBookings]);

  const handleTimeChange = (dates) => {
    // Clear previous validation error when user changes time
    setValidationError(null);
    
    if (dates && dates[0] && dates[1]) {
      const duration = dates[1].diff(dates[0], 'hour', true);
      setEstimatedDuration(duration);
      
      // Validate immediately when time changes
      const validation = validateBookingTime(dates);
      if (!validation.valid) {
        setValidationError(validation.error);
      }
    } else {
      setEstimatedDuration(null);
    }
  };

  const validateBookingTime = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      return { valid: false, error: "Please select start and end time" };
    }

    const now = dayjs();
    const start = dates[0];
    const end = dates[1];

    // Check minimum advance booking
    const hoursUntilStart = start.diff(now, 'hour', true);
    if (hoursUntilStart < BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS) {
      return { 
        valid: false, 
        error: `Booking must be at least ${BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS} hours in advance` 
      };
    }

    // Check maximum advance booking
    const daysUntilStart = start.diff(now, 'day', true);
    if (daysUntilStart > BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS) {
      return { 
        valid: false, 
        error: `Booking cannot be more than ${BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} days in advance` 
      };
    }

    // Check basic duration validity
    const duration = end.diff(start, 'hour', true);
    if (duration <= 0) {
      return { valid: false, error: "End time must be after start time" };
    }

    // Check for overlapping bookings
    const overlap = existingBookings.some(booking => {
      if (booking.status === 'CANCELLED') {
        return false;
      }
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      
      return (
        (start.isBefore(bookingEnd) && end.isAfter(bookingStart)) ||
        (start.isSame(bookingStart) || end.isSame(bookingEnd))
      );
    });

    if (overlap) {
      return { 
        valid: false, 
        error: "This time slot overlaps with an existing booking" 
      };
    }

    // Check quota limits if quota info is available
    if (quotaInfo && quotaInfo.data) {
      const quota = quotaInfo.data;
      const weekStartDate = dayjs(quota.weekStartDate);
      const nextWeekStartDate = weekStartDate.add(7, 'day');
      const nextWeekEndDate = nextWeekStartDate.add(7, 'day');

      // Check if booking is in current week, next week, or spans both weeks
      const isCurrentWeek = start.isBefore(nextWeekStartDate);
      const isNextWeek = end.isAfter(nextWeekStartDate) || start.isAfter(nextWeekStartDate) || start.isSame(nextWeekStartDate);
      const spansWeeks = start.isBefore(nextWeekStartDate) && end.isAfter(nextWeekStartDate);

      // Calculate hours for current week and next week
      let hoursCurrentWeek = 0;
      let hoursNextWeek = 0;

      if (spansWeeks) {
        // Booking spans both weeks
        hoursCurrentWeek = nextWeekStartDate.diff(start, 'hour', true);
        hoursNextWeek = end.diff(nextWeekStartDate, 'hour', true);
      } else if (isCurrentWeek && !isNextWeek) {
        // Booking is only in current week
        hoursCurrentWeek = duration;
      } else if (isNextWeek) {
        // Booking is only in next week
        hoursNextWeek = duration;
      }

      // Validate current week quota
      if (hoursCurrentWeek > 0) {
        const totalUsedCurrentWeek = quota.hoursUsed + quota.hoursDebt + hoursCurrentWeek;
        if (totalUsedCurrentWeek > quota.hoursLimit) {
          return {
            valid: false,
            error: `Cannot book for current week. You need ${hoursCurrentWeek.toFixed(1)} hours but only ${quota.remainingHours.toFixed(1)} hours remaining (Used: ${quota.hoursUsed.toFixed(1)}h, Debt: ${quota.hoursDebt.toFixed(1)}h, Limit: ${quota.hoursLimit}h)`
          };
        }
      }

      // Validate next week quota
      if (hoursNextWeek > 0) {
        const excessDebt = Math.max(0, (quota.hoursUsed + quota.hoursDebt) - quota.hoursLimit);
        const totalUsedNextWeek = excessDebt + quota.hoursAdvance + hoursNextWeek;
        if (totalUsedNextWeek > quota.hoursLimit) {
          return {
            valid: false,
            error: `Cannot book for next week. You need ${hoursNextWeek.toFixed(1)} hours but only ${quota.remainingHoursNextWeek.toFixed(1)} hours remaining (Excess debt: ${excessDebt.toFixed(1)}h, Advance: ${quota.hoursAdvance.toFixed(1)}h, Limit: ${quota.hoursLimit}h)`
          };
        }
      }

      // Validate if booking spans both weeks
      if (spansWeeks) {
        const currentWeekCheck = (quota.hoursUsed + quota.hoursDebt + hoursCurrentWeek) <= quota.hoursLimit;
        const excessDebt = Math.max(0, (quota.hoursUsed + quota.hoursDebt) - quota.hoursLimit);
        const nextWeekCheck = (excessDebt + quota.hoursAdvance + hoursNextWeek) <= quota.hoursLimit;
        
        if (!currentWeekCheck || !nextWeekCheck) {
          return {
            valid: false,
            error: `Cannot book across weeks. Current week needs ${hoursCurrentWeek.toFixed(1)}h (${quota.remainingHours.toFixed(1)}h available), next week needs ${hoursNextWeek.toFixed(1)}h (${quota.remainingHoursNextWeek.toFixed(1)}h available)`
          };
        }
      }
    }

    return { valid: true };
  };

  const handleSubmit = async (values) => {
    const { timeRange } = values;
    
    console.log("Form values:", values);
    console.log("Group ID:", groupId);
    console.log("Vehicle ID:", vehicleId);
    console.log("Time range:", timeRange);
    
    const validation = validateBookingTime(timeRange);
    console.log("Validation result:", validation);
    if (!validation.valid) {
      console.log("Validation failed:", validation.error);
      setValidationError(validation.error);
      message.error(validation.error);
      return;
    }

    // Clear validation error if validation passes
    setValidationError(null);

    setLoading(true);
    try {
      console.log("Converting time range to payload...");
      console.log("Start time:", timeRange[0]);
      console.log("End time:", timeRange[1]);
      
      // Format time as YYYY-MM-DDTHH:mm:ss.SSS (without timezone 'Z')
      const startTimeFormatted = timeRange[0].format('YYYY-MM-DDTHH:mm:ss.SSS');
      const endTimeFormatted = timeRange[1].format('YYYY-MM-DDTHH:mm:ss.SSS');
      
      console.log("Start formatted:", startTimeFormatted);
      console.log("End formatted:", endTimeFormatted);
      
      const payload = {
        groupId,
        vehicleId,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      };

      console.log("Creating booking with payload:", payload);
      const response = await api.post("/booking/create", payload);
      console.log("Booking created successfully:", response.data);
      message.success("Booking created successfully!");
      form.resetFields();
      setEstimatedDuration(null);
      setValidationError(null);
      onSuccess();
    } catch (error) {
      console.error("Failed to create booking:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      
      let errorMsg = "Failed to create booking";
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

  const disabledDate = (current) => {
    const now = dayjs();
    const maxDate = dayjs().add(BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS, 'day');
    return current && (current < now.startOf('day') || current > maxDate.endOf('day'));
  };

  const disabledTime = (current, type) => {
    const now = dayjs();
    const minBookingTime = now.add(BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS, 'hour');
    
    // Nếu không có ngày được chọn hoặc type không hợp lệ, không disable gì
    if (!current || !type) {
      return {};
    }

    const selectedDate = dayjs(current);

    // Xử lý cho start time
    if (type === 'start') {
      // Nếu ngày được chọn là hôm nay
      if (selectedDate.isSame(now, 'day')) {
        const minHour = minBookingTime.hour();
        const minMinute = minBookingTime.minute();
        
        return {
          disabledHours: () => {
            // Disable tất cả các giờ trước giờ tối thiểu
            const hours = [];
            for (let i = 0; i < minHour; i++) {
              hours.push(i);
            }
            return hours;
          },
          disabledMinutes: (selectedHour) => {
            // Nếu chọn đúng giờ tối thiểu, disable các phút trước phút tối thiểu
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
      const timeRange = form.getFieldValue('timeRange');
      const startTime = timeRange && timeRange[0] ? dayjs(timeRange[0]) : null;
      
      if (!startTime) {
        // Nếu chưa chọn start time, áp dụng rule giống start time
        if (selectedDate.isSame(now, 'day')) {
          const minHour = minBookingTime.hour();
          const minMinute = minBookingTime.minute();
          
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
        // Nếu đã chọn start time, end time phải sau start time
        // Nếu end date = start date
        if (selectedDate.isSame(startTime, 'day')) {
          const startHour = startTime.hour();
          const startMinute = startTime.minute();
          
          return {
            disabledHours: () => {
              // Disable tất cả các giờ trước hoặc bằng giờ start
              const hours = [];
              for (let i = 0; i <= startHour; i++) {
                hours.push(i);
              }
              return hours;
            },
            disabledMinutes: (selectedHour) => {
              // Nếu chọn giờ ngay sau start hour, disable các phút <= start minute
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
    
    // Mặc định không disable gì
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
      disabledSeconds: () => [],
    };
  };

  const handleCancel = () => {
    form.resetFields();
    setEstimatedDuration(null);
    setValidationError(null);
    setQuotaInfo(null);
    setCompletedBookings([]);
    setRawBookings([]);
    onCancel();
  };

  return (
    <Modal
      title="Create New Booking"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Alert
        message="Booking Rules"
        description={
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Book at least {BOOKING_CONSTRAINTS.MIN_ADVANCE_HOURS} hours in advance</li>
            <li>Maximum {BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} days in advance</li>
            <li>End time must be after start time</li>
            <li>Cannot overlap with existing bookings</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quota Information Alert */}
      {quotaLoading ? (
        <Alert
          message="Loading quota information..."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : quotaInfo && quotaInfo.data && (
        <Alert
          message="Booking Hours Quota"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                You have {quotaInfo.data.remainingHours.toFixed(0)} hours {((quotaInfo.data.remainingHours % 1) * 60).toFixed(0)} minutes left to book this week, and {quotaInfo.data.remainingHoursNextWeek.toFixed(0)} hours to book in advance for next week.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: 12 }}>
                <div>
                  <strong>Hours Used:</strong> <span style={{ color: '#1890ff', fontWeight: 600 }}>{quotaInfo.data.hoursUsed.toFixed(2)}h</span>
                </div>
                <div>
                  <strong>Penalty Hours:</strong> <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{quotaInfo.data.hoursDebt.toFixed(2)}h</span>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                Week starting: {dayjs(quotaInfo.data.weekStartDate).format('MM/DD/YYYY')}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Completed Bookings This Week */}
      {bookingsLoading ? (
        <Alert
          message="Loading completed bookings..."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          message="Completed Bookings This Week"
          description={
            <div>
              {completedBookings.length > 0 ? (
                <>
                  <div style={{ marginBottom: 8 }}>
                    {completedBookings.length} completed booking{completedBookings.length > 1 ? 's' : ''} this week:
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {completedBookings.map((booking, index) => {
                      const startTime = dayjs(booking.startTime);
                      const endTime = dayjs(booking.endTime);
                      const duration = endTime.diff(startTime, 'hour', true);
                      
                      return (
                        <div 
                          key={booking.id} 
                          style={{ 
                            padding: '8px 12px', 
                            margin: '4px 0',
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#389e0d' }}>
                            {startTime.format('MMM DD, YYYY HH:mm')} - {endTime.format('HH:mm')}
                          </div>
                          <div style={{ color: '#666' }}>
                            Duration: {duration.toFixed(1)} hours • Status: COMPLETE
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>
                  No completed bookings this week yet.
                </div>
              )}
              {quotaInfo?.data && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                  Week starting: {dayjs(quotaInfo.data.weekStartDate).format('MM/DD/YYYY')}
                </div>
              )}
            </div>
          }
          type={completedBookings.length > 0 ? "success" : "warning"}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <Alert
          message="Booking Validation Error"
          description={validationError}
          type="error"
          showIcon
          closable
          onClose={() => setValidationError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="timeRange"
          label="Booking Time"
          rules={[{ required: true, message: "Please select booking time" }]}
        >
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            onChange={handleTimeChange}
            minuteStep={15}
          />
        </Form.Item>

        {estimatedDuration !== null && (
          <Alert
            message={`Duration: ${estimatedDuration.toFixed(1)} hours`}
            type="success"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Booking
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBookingModal;
