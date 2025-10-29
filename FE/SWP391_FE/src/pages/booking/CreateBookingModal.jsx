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
  const [validationError, setValidationError] = useState(null);

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

  const handleCancel = () => {
    form.resetFields();
    setEstimatedDuration(null);
    setValidationError(null);
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
        style={{ marginBottom: 24 }}
      />

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
