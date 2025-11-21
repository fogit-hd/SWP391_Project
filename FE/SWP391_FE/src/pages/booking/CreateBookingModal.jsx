import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  Button,
  message,
  Alert,
  List,
} from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";
import { BOOKING_CONSTRAINTS } from "./booking.types";
import { toast } from "react-toastify";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const formatHoursToLabel = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0 giờ 0 phút";
  }
  const totalMinutes = Math.round(Number(value) * 60);
  const sign = totalMinutes < 0 ? "-" : "";
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${sign}${hours} giờ ${minutes} phút`;
};
const ACTIVE_BOOKING_STATUSES = ["BOOKED", "INUSE", "IN USE", "OVERTIME"];

const CreateBookingModal = ({
  visible,
  onCancel,
  onSuccess,
  groupId,
  vehicleId,
  existingBookings = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Fetch quota information when modal opens
  React.useEffect(() => {
    if (visible && groupId && vehicleId) {
      fetchQuotaInfo();
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
      message.error("Không thể tải thông tin hạn ngạch đặt lịch");
    } finally {
      setQuotaLoading(false);
    }
  };


  const handleTimeChange = (dates) => {
    // Clear previous validation error when user changes time
    setValidationError(null);

    if (dates && dates[0] && dates[1]) {
      const duration = dates[1].diff(dates[0], "hour", true);
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
      return {
        valid: false,
        error: "Vui lòng chọn thời gian bắt đầu và kết thúc",
      };
    }

    const now = dayjs();
    const start = dates[0];
    const end = dates[1];

    // Check minimum advance booking (phải đặt trước ít nhất 15 phút)
    const minutesFromNow = start.diff(now, "minute", true);
    const minAllowedTime = now.add(
      BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES,
      "minute"
    );

    if (start.isBefore(minAllowedTime)) {
      return {
        valid: false,
        error: `Thời gian bắt đầu phải cách thời gian hiện tại ít nhất ${BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES} phút`,
      };
    }

    // Check maximum advance booking (chỉ trong tuần này và tuần sau)
    // Nếu có quota info, dùng weekStartDate làm mốc
    if (quotaInfo?.data?.weekStartDate) {
      const weekStartDate = dayjs(quotaInfo.data.weekStartDate);
      const twoWeeksEnd = weekStartDate.add(14, "day");

      if (start.isAfter(twoWeeksEnd)) {
        return {
          valid: false,
          error: `Chỉ có thể đặt trong tuần này và tuần sau (từ ${weekStartDate.format(
            "DD/MM/YYYY"
          )} đến ${twoWeeksEnd.format("DD/MM/YYYY")})`,
        };
      }
    } else {
      // Fallback nếu chưa có quota info
      const daysUntilStart = start.diff(now, "day", true);
      if (daysUntilStart > BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS) {
        return {
          valid: false,
          error: `Chỉ có thể đặt trong tuần này và tuần sau (không quá ${BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS} ngày)`,
        };
      }
    }

    // Check basic duration validity
    const duration = end.diff(start, "hour", true);
    if (duration <= 0) {
      return {
        valid: false,
        error: "Thời gian kết thúc phải sau thời gian bắt đầu",
      };
    }

    // Check for overlapping bookings and minimum gap (30 phút)
    const minGapMinutes = BOOKING_CONSTRAINTS.MIN_GAP_MINUTES;
    const conflictBooking = existingBookings.find((booking) => {
      const normalizedStatus = (booking.status || "")
        .toString()
        .toUpperCase();
      if (!ACTIVE_BOOKING_STATUSES.includes(normalizedStatus)) {
        return false;
      }
      const bookingStart = dayjs(booking.startTime);
      const bookingEnd = dayjs(booking.endTime);

      // Kiểm tra overlap trực tiếp
      const hasOverlap =
        (start.isBefore(bookingEnd) && end.isAfter(bookingStart)) ||
        start.isSame(bookingStart) ||
        end.isSame(bookingEnd);

      if (hasOverlap) {
        return true;
      }

      // Kiểm tra khoảng cách tối thiểu 30 phút
      // Nếu booking mới kết thúc trước booking hiện tại
      if (end.isBefore(bookingStart) || end.isSame(bookingStart)) {
        const gapMinutes = bookingStart.diff(end, "minute", true);
        if (gapMinutes < minGapMinutes) {
          return true;
        }
      }

      // Nếu booking mới bắt đầu sau booking hiện tại
      if (start.isAfter(bookingEnd) || start.isSame(bookingEnd)) {
        const gapMinutes = start.diff(bookingEnd, "minute", true);
        if (gapMinutes < minGapMinutes) {
          return true;
        }
      }

      return false;
    });

    if (conflictBooking) {
      return {
        valid: false,
        error: `Thời gian đặt phải cách các booking khác ít nhất ${minGapMinutes} phút`,
      };
    }

    // Check quota limits if quota info is available
    if (quotaInfo && quotaInfo.data) {
      const quota = quotaInfo.data;
      const weekStartDate = dayjs(quota.weekStartDate);
      const nextWeekStartDate = weekStartDate.add(7, "day");
      const nextWeekEndDate = nextWeekStartDate.add(7, "day");

      // Check if booking is in current week, next week, or spans both weeks
      const isCurrentWeek = start.isBefore(nextWeekStartDate);
      const isNextWeek =
        end.isAfter(nextWeekStartDate) ||
        start.isAfter(nextWeekStartDate) ||
        start.isSame(nextWeekStartDate);
      const spansWeeks =
        start.isBefore(nextWeekStartDate) && end.isAfter(nextWeekStartDate);

      // Calculate hours for current week and next week
      let hoursCurrentWeek = 0;
      let hoursNextWeek = 0;

      if (spansWeeks) {
        // Booking spans both weeks
        hoursCurrentWeek = nextWeekStartDate.diff(start, "hour", true);
        hoursNextWeek = end.diff(nextWeekStartDate, "hour", true);
      } else if (isCurrentWeek && !isNextWeek) {
        // Booking is only in current week
        hoursCurrentWeek = duration;
      } else if (isNextWeek) {
        // Booking is only in next week
        hoursNextWeek = duration;
      }

      // Validate current week quota
      if (hoursCurrentWeek > 0) {
        const totalUsedCurrentWeek =
          quota.hoursUsed + quota.hoursDebt + hoursCurrentWeek;
        if (totalUsedCurrentWeek > quota.hoursLimit) {
          return {
            valid: false,
            error: `Không thể đặt cho tuần này. Bạn cần ${formatHoursToLabel(
              hoursCurrentWeek
            )} nhưng chỉ còn ${formatHoursToLabel(
              quota.remainingHours
            )} (Đã dùng: ${formatHoursToLabel(
              quota.hoursUsed
            )}, Nợ: ${formatHoursToLabel(
              quota.hoursDebt
            )}, Giới hạn: ${formatHoursToLabel(quota.hoursLimit)})`,
          };
        }
      }

      // Validate next week quota
      if (hoursNextWeek > 0) {
        const excessDebt = Math.max(
          0,
          quota.hoursUsed + quota.hoursDebt - quota.hoursLimit
        );
        const totalUsedNextWeek =
          excessDebt + quota.hoursAdvance + hoursNextWeek;
        if (totalUsedNextWeek > quota.hoursLimit) {
          return {
            valid: false,
            error: `Không thể đặt cho tuần sau. Bạn cần ${formatHoursToLabel(
              hoursNextWeek
            )} nhưng chỉ còn ${formatHoursToLabel(
              quota.remainingHoursNextWeek
            )} (Nợ dư: ${formatHoursToLabel(
              excessDebt
            )}, Trước: ${formatHoursToLabel(
              quota.hoursAdvance
            )}, Giới hạn: ${formatHoursToLabel(quota.hoursLimit)})`,
          };
        }
      }

      // Validate if booking spans both weeks
      if (spansWeeks) {
        const currentWeekCheck =
          quota.hoursUsed + quota.hoursDebt + hoursCurrentWeek <=
          quota.hoursLimit;
        const excessDebt = Math.max(
          0,
          quota.hoursUsed + quota.hoursDebt - quota.hoursLimit
        );
        const nextWeekCheck =
          excessDebt + quota.hoursAdvance + hoursNextWeek <= quota.hoursLimit;

        if (!currentWeekCheck || !nextWeekCheck) {
          return {
            valid: false,
            error: `Không thể đặt trải dài qua 2 tuần. Tuần này cần ${formatHoursToLabel(
              hoursCurrentWeek
            )} (còn ${formatHoursToLabel(
              quota.remainingHours
            )}), tuần sau cần ${formatHoursToLabel(
              hoursNextWeek
            )} (còn ${formatHoursToLabel(quota.remainingHoursNextWeek)})`,
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
      const startTimeFormatted = timeRange[0].format("YYYY-MM-DDTHH:mm:ss.SSS");
      const endTimeFormatted = timeRange[1].format("YYYY-MM-DDTHH:mm:ss.SSS");

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

      // Hiển thị message từ backend hoặc message mặc định
      const successMessage =
        response.data?.message || "Tạo đặt lịch thành công!";
      toast.success(successMessage);

      form.resetFields();
      setEstimatedDuration(null);
      setValidationError(null);
      onSuccess();
    } catch (error) {
      console.error("Failed to create booking:", error);
      console.error("Error response:", error.response?.data);

      let errorMsg = "Không thể tạo đặt lịch";

      if (error.response?.data) {
        const errorData = error.response.data;

        // 1. Ưu tiên message từ backend (đã có thông báo cụ thể)
        if (errorData.message) {
          errorMsg = errorData.message;
        }
        // 2. Xử lý validation errors
        else if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMsg = errorData.errors.join(", ");
          } else if (typeof errorData.errors === "object") {
            const fieldNames = {
              GroupId: "Nhóm",
              VehicleId: "Xe",
              StartTime: "Thời gian bắt đầu",
              EndTime: "Thời gian kết thúc",
            };

            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => {
                const messageArray = Array.isArray(messages)
                  ? messages
                  : [messages];
                const fieldName = fieldNames[field] || field;
                return `${fieldName}: ${messageArray.join(", ")}`;
              })
              .join("\n");
            errorMsg = errorMessages;
          }
        }
        // 3. Plain string error
        else if (typeof errorData === "string") {
          errorMsg = errorData;
        }
        // 4. Các format khác
        else if (errorData.error) {
          errorMsg = errorData.error;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      }
      // Network error
      else if (error.message) {
        errorMsg = `Không thể kết nối đến server: ${error.message}`;
      }

      // Hiển thị error message
      message.error({
        content: errorMsg,
        duration: 6,
      });

      setValidationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    if (!current) return false;

    const now = dayjs();

    // Nếu có thông tin quota với weekStartDate, dùng nó làm mốc
    if (quotaInfo?.data?.weekStartDate) {
      const weekStartDate = dayjs(quotaInfo.data.weekStartDate);
      // Tuần sau kết thúc vào Chủ nhật của tuần thứ 2 (13 ngày sau ngày bắt đầu)
      const twoWeeksEnd = weekStartDate.add(13, "day").endOf("day");

      // Không cho phép chọn ngày trong quá khứ và sau 2 tuần
      return current < now.startOf("day") || current > twoWeeksEnd;
    }

    // Fallback: nếu chưa có quota info, dùng logic cũ
    const maxDate = dayjs().add(BOOKING_CONSTRAINTS.MAX_ADVANCE_DAYS, "day");
    return current < now.startOf("day") || current > maxDate.endOf("day");
  };

  const disabledTime = (current, type) => {
    const now = dayjs();
    // Phải đặt trước ít nhất 15 phút
    const minAllowedTime = now.add(
      BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES,
      "minute"
    );

    // Nếu không có ngày được chọn hoặc type không hợp lệ, không disable gì
    if (!current || !type) {
      return {};
    }

    const selectedDate = dayjs(current);

    // Xử lý cho start time
    if (type === "start") {
      // Nếu ngày được chọn là hôm nay
      if (selectedDate.isSame(now, "day")) {
        const minHour = minAllowedTime.hour();
        const minMinute = minAllowedTime.minute();

        return {
          disabledHours: () => {
            // Disable tất cả các giờ trước giờ tối thiểu (15 phút sau hiện tại)
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
    if (type === "end") {
      const timeRange = form.getFieldValue("timeRange");
      const startTime = timeRange && timeRange[0] ? dayjs(timeRange[0]) : null;

      if (!startTime) {
        // Nếu chưa chọn start time, áp dụng rule giống start time
        if (selectedDate.isSame(now, "day")) {
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
        // Nếu đã chọn start time, end time phải sau start time
        // Nếu end date = start date
        if (selectedDate.isSame(startTime, "day")) {
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
    onCancel();
  };

  return (
    <Modal
      title="Tạo đặt lịch mới"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
      style={{ top: 10 }}
    >
      <Alert
        message="Quy tắc đặt lịch"
        description={
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>
              Đặt trước thời gian hiện tại ít nhất{" "}
              {BOOKING_CONSTRAINTS.MIN_ADVANCE_MINUTES} phút
            </li>
            <li>Chỉ có thể đặt trong tuần này và tuần sau (2 tuần)</li>
            <li>
              Phải cách các booking khác ít nhất{" "}
              {BOOKING_CONSTRAINTS.MIN_GAP_MINUTES} phút
            </li>
            <li>Không được trùng với các đặt lịch hiện có</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quota Information Alert */}
      {quotaLoading ? (
        <Alert
          message="Đang tải thông tin hạn ngạch..."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        quotaInfo &&
        quotaInfo.data && (
          <Alert
            message="Giờ sử dụng dịch vụ trong tuần"
            description={
              <div>
                <div style={{ marginBottom: 12 }}>
                  Bạn còn {formatHoursToLabel(quotaInfo.data.remainingHours)} để
                  đặt trong tuần này, và{" "}
                  {formatHoursToLabel(
                    quotaInfo.data.remainingHoursNextWeek
                  )}{" "}
                  để đặt trước cho tuần sau.
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <strong>Giờ đã dùng:</strong>{" "}
                    <span style={{ color: "#1890ff", fontWeight: 600 }}>
                      {formatHoursToLabel(quotaInfo.data.hoursUsed)}
                    </span>
                  </div>
                  <div>
                    <strong>Giờ phạt:</strong>{" "}
                    <span style={{ color: "#ff4d4f", fontWeight: 600 }}>
                      {formatHoursToLabel(quotaInfo.data.hoursDebt)}
                    </span>
                  </div>
                  <div>
                    <strong>Tỷ lệ sở hữu:</strong>{" "}
                    <span style={{ color: "#52c41a", fontWeight: 600 }}>
                      {quotaInfo.data.ownershipRate?.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <strong>Giờ tối đa/tuần:</strong>{" "}
                    <span style={{ color: "#722ed1", fontWeight: 600 }}>
                      {(() => {
                        const totalHours =
                          quotaInfo.data.hoursLimit /
                          ((quotaInfo.data.ownershipRate || 100) / 100);
                        return formatHoursToLabel(totalHours);
                      })()}
                    </span>
                    <div style={{ color: "#8c8c8c", fontSize: "11px" }}>
                      (Cách tính: {quotaInfo.data.hoursLimit.toFixed(2)} /{" "}
                      {((quotaInfo.data.ownershipRate || 100) / 100).toFixed(2)}
                      )
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#f0f5ff",
                    borderRadius: "4px",
                    border: "1px solid #adc6ff",
                    marginBottom: 8,
                  }}
                >
                  <strong>Thời gian đặt trong tuần:</strong>{" "}
                  <span
                    style={{
                      color: "#1890ff",
                      fontWeight: 600,
                      fontSize: "15px",
                    }}
                  >
                    {formatHoursToLabel(quotaInfo.data.hoursLimit)}
                  </span>
                </div>
                <div
                  style={{ marginTop: 8, fontSize: "12px", color: "#8c8c8c" }}
                >
                  Tuần bắt đầu:{" "}
                  {dayjs(quotaInfo.data.weekStartDate).format("DD/MM/YYYY")}
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <Alert
          message="Lỗi xác thực đặt lịch"
          description={validationError}
          type="error"
          showIcon
          closable
          onClose={() => setValidationError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="timeRange"
          label="Thời gian đặt lịch"
          rules={[
            { required: true, message: "Vui lòng chọn thời gian đặt lịch" },
          ]}
        >
          <RangePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            onChange={handleTimeChange}
            minuteStep={1}
          />
        </Form.Item>

        {estimatedDuration !== null && (
          <Alert
            message={`Thời lượng: ${formatHoursToLabel(estimatedDuration)}`}
            type="success"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo đặt lịch
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBookingModal;
