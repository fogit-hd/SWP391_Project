import React, { useState } from "react";
import { Modal, Form, DatePicker, Input, Button, message, Alert } from "antd";
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

  const handleTimeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const duration = dates[1].diff(dates[0], 'hour', true);
      setEstimatedDuration(duration);
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

    // Check maximum duration
    const duration = end.diff(start, 'hour', true);
    if (duration > BOOKING_CONSTRAINTS.MAX_DURATION_HOURS) {
      return { 
        valid: false, 
        error: `Maximum booking duration is ${BOOKING_CONSTRAINTS.MAX_DURATION_HOURS} hours` 
      };
    }

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

    // Check minimum gap (30 minutes) with existing bookings
    const hasInsufficientGap = existingBookings.some(booking => {
      if (booking.status === 'CANCELLED') {
        return false;
      }
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);
      
      const gapBefore = start.diff(bookingEnd, 'minute');
      const gapAfter = bookingStart.diff(end, 'minute');
      
      return (gapBefore > 0 && gapBefore < BOOKING_CONSTRAINTS.MIN_GAP_MINUTES) ||
             (gapAfter > 0 && gapAfter < BOOKING_CONSTRAINTS.MIN_GAP_MINUTES);
    });

    if (hasInsufficientGap) {
      return { 
        valid: false, 
        error: `Minimum ${BOOKING_CONSTRAINTS.MIN_GAP_MINUTES} minutes gap required between bookings (for charging)` 
      };
    }

    return { valid: true };
  };

  const handleSubmit = async (values) => {
    const { timeRange, notes } = values;
    
    const validation = validateBookingTime(timeRange);
    if (!validation.valid) {
      message.error(validation.error);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        groupId,
        vehicleId,
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
        notes: notes || "",
      };

      await api.post("/booking/create", payload);
      message.success("Booking created successfully!");
      form.resetFields();
      setEstimatedDuration(null);
      onSuccess();
    } catch (error) {
      console.error("Failed to create booking:", error);
      const errorMsg = error.response?.data?.message || "Failed to create booking";
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

  return (
    <Modal
      title="Create New Booking"
      open={visible}
      onCancel={onCancel}
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
            <li>Maximum {BOOKING_CONSTRAINTS.MAX_DURATION_HOURS} hours per booking</li>
            <li>{BOOKING_CONSTRAINTS.MIN_GAP_MINUTES} minutes gap required between bookings</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

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
            onChange={handleTimeChange}
            minuteStep={15}
          />
        </Form.Item>

        {estimatedDuration !== null && (
          <Alert
            message={`Duration: ${estimatedDuration.toFixed(1)} hours`}
            type={estimatedDuration <= BOOKING_CONSTRAINTS.MAX_DURATION_HOURS ? "success" : "error"}
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="notes"
          label="Notes (Optional)"
        >
          <TextArea
            rows={3}
            placeholder="Add any notes about this booking..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
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
