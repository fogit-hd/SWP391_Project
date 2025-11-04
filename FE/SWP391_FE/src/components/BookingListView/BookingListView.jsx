import React, { useState } from 'react';
import { Card, List, Tag, Avatar, Space, Button, Select, Input, DatePicker } from 'antd';
import { UserOutlined, CalendarOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../../pages/booking/booking.types';
import './BookingListView.css';

const { RangePicker } = DatePicker;

const BookingListView = ({ bookings = [], onBookingClick, loading = false }) => {
  const [filteredBookings, setFilteredBookings] = useState(bookings);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [sortBy, setSortBy] = useState('startTime');

  React.useEffect(() => {
    filterAndSortBookings();
  }, [bookings, statusFilter, searchText, dateRange, sortBy]);

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(booking => 
        booking.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.notes?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(booking => {
        const bookingStart = dayjs(booking.startTime);
        const bookingEnd = dayjs(booking.endTime);
        return bookingStart.isBetween(dateRange[0], dateRange[1], 'day', '[]') ||
               bookingEnd.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          return dayjs(a.startTime).unix() - dayjs(b.startTime).unix();
        case 'duration':
          const durationA = dayjs(a.endTime).diff(dayjs(a.startTime), 'hour');
          const durationB = dayjs(b.endTime).diff(dayjs(b.startTime), 'hour');
          return durationB - durationA;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'user':
          return (a.userName || '').localeCompare(b.userName || '');
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const calculateDuration = (startTime, endTime) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const hours = end.diff(start, 'hour');
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      BOOKED: '📅',
      INUSE: '🚗',
      COMPLETED: '✅',
      COMPLETE: '✅', // API trả về COMPLETE
      CANCELLED: '❌',
      OVERTIME: '⏰'
    };
    return iconMap[status] || '📋';
  };

  const renderBookingCard = (booking) => {
    const startTime = dayjs(booking.startTime);
    const endTime = dayjs(booking.endTime);
    const duration = calculateDuration(booking.startTime, booking.endTime);
    const isLongTerm = endTime.diff(startTime, 'day') >= 1;

    return (
      <Card
        hoverable
        className={`booking-card ${isLongTerm ? 'long-term' : 'short-term'}`}
        onClick={() => onBookingClick?.(booking)}
        style={{ marginBottom: 12 }}
      >
        <div className="booking-card-content">
          <div className="booking-header">
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div className="booking-user">{booking.userName || ''}</div>
                <div className="booking-id">#{booking.id?.slice(-8)}</div>
              </div>
            </Space>
            <Space>
              <div className="duration-badge">
                <ClockCircleOutlined />
                {duration}
              </div>
              <Tag color={BOOKING_STATUS_COLORS[booking.status]}>
                {getStatusIcon(booking.status)} {BOOKING_STATUS_LABELS[booking.status]}
              </Tag>
            </Space>
          </div>

          <div className="booking-time-info">
            <div className="time-block">
              <CalendarOutlined />
              <div>
                <div className="time-label">Bắt đầu</div>
                <div className="time-value">{startTime.format('dddd, DD/MM/YYYY')}</div>
                <div className="time-detail">{startTime.format('HH:mm')}</div>
              </div>
            </div>

            <div className="duration-indicator">
              <div className="duration-line" />
            </div>

            <div className="time-block">
              <CalendarOutlined />
              <div>
                <div className="time-label">Kết thúc</div>
                <div className="time-value">{endTime.format('dddd, DD/MM/YYYY')}</div>
                <div className="time-detail">{endTime.format('HH:mm')}</div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="booking-notes">
              <strong>Ghi chú:</strong> {booking.notes}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="booking-list-view">
      <div className="list-filters">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
        >
          <Select.Option value="all">Tất cả trạng thái</Select.Option>
          {Object.keys(BOOKING_STATUS_LABELS).map(status => (
            <Select.Option key={status} value={status}>
              {BOOKING_STATUS_LABELS[status]}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div className="list-summary">
        <Space>
          <span>Tổng: {filteredBookings.length} đặt chỗ</span>
          <span>•</span>
          <span>Dài hạn (1+ ngày): {filteredBookings.filter(b => 
            dayjs(b.endTime).diff(dayjs(b.startTime), 'day') >= 1
          ).length}</span>
        </Space>
      </div>

      <List
        loading={loading}
        dataSource={filteredBookings}
        renderItem={renderBookingCard}
        locale={{ emptyText: 'Không tìm thấy đặt chỗ nào' }}
      />
    </div>
  );
};

export default BookingListView;