import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Avatar, Space, Button, Select, Input, DatePicker, Tabs } from 'antd';
import { UserOutlined, CalendarOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../../pages/booking/booking.types';
import './BookingListView.css';

const { RangePicker } = DatePicker;

const BookingListView = ({ bookings = [], onBookingClick, loading = false, activeTab = 'all', onTabChange }) => {
  const [filteredBookings, setFilteredBookings] = useState(bookings);
  const [statusFilter, setStatusFilter] = useState(activeTab);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [sortBy, setSortBy] = useState('startTime');

  // Sync internal state with prop
  useEffect(() => {
    setStatusFilter(activeTab);
  }, [activeTab]);

  useEffect(() => {
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
          const statusPriority = { 'BOOKED': 1, 'INUSE': 2, 'OVERTIME': 3, 'COMPLETE': 4, 'CANCELLED': 5 };
          const priorityA = statusPriority[a.status] || 6;
          const priorityB = statusPriority[b.status] || 6;
          
          if (statusFilter === 'all') {
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
          }
          
          return dayjs(b.startTime).unix() - dayjs(a.startTime).unix();
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

  const handleTabChange = (key) => {
    setStatusFilter(key);
    onTabChange?.(key);
  };

  const getTabItems = () => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const allCount = bookings.length;

    // Định nghĩa thứ tự hiển thị tab, CANCELLED ở cuối
    const statusOrder = ['BOOKED', 'INUSE', 'OVERTIME', 'COMPLETE', 'CANCELLED'];

    return [
      {
        key: 'all',
        label: `Tất cả (${allCount})`,
      },
      ...statusOrder
        .filter(status => BOOKING_STATUS_LABELS[status]) // Chỉ lấy status có trong BOOKING_STATUS_LABELS
        .map(status => ({
          key: status,
          label: `${getStatusIcon(status)} ${BOOKING_STATUS_LABELS[status]} (${statusCounts[status] || 0})`,
        }))
    ];
  };

  const calculateDuration = (startTime, endTime) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const totalMinutes = end.diff(start, 'minute');
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
                <div className="booking-user">{booking.userName || 'Không có tên'}</div>
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
      <Tabs
        activeKey={statusFilter}
        onChange={handleTabChange}
        items={getTabItems()}
        style={{ marginBottom: 16 }}
      />

      <div className="list-summary">
        <Space>
          <span>Hiển thị: {filteredBookings.length} đặt lịch</span>
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
        locale={{ emptyText: 'Không tìm thấy đặt lịch nào' }}
      />
    </div>
  );
};

export default BookingListView;