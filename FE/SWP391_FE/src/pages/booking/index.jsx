import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Select, Space, Spin, message, Tag, Badge, Tooltip, Modal } from "antd";
import { CalendarOutlined, PlusOutlined, ReloadOutlined, CarOutlined, ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import CreateBookingModal from "./CreateBookingModal";
import BookingDetailModal from "./BookingDetailModal";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "./booking.types";
import "./booking.css";


const BookingCalendar = () => {
  const { isAuthenticated, isCoOwner } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupVehicles, setGroupVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !isCoOwner) {
      message.error("You must be a Co-owner to access booking");
      navigate("/login");
      return;
    }
    fetchMyGroups();
  }, [isAuthenticated, isCoOwner, navigate]);

  // Auto-refresh has been disabled - use manual Refresh button instead

  const fetchMyGroups = async () => {
    try {
      const res = await api.get("/CoOwnership/my-groups");
      const groups = res.data?.data || res.data || [];
      setMyGroups(groups);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      message.error("Failed to load your groups");
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupVehicles();
    }
  }, [selectedGroupId]);

  // Auto-load bookings when vehicle is selected (first time only)
  useEffect(() => {
    if (selectedGroupId && selectedVehicleId) {
      fetchBookings();
    }
  }, [selectedGroupId, selectedVehicleId]);

  const fetchGroupVehicles = async () => {
    try {
      const res = await api.get(`/CoOwnership/${selectedGroupId}/vehicles`);
      const vehicles = res.data?.data || res.data || [];
      setGroupVehicles(vehicles);
      if (vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0].id || vehicles[0].vehicleId);
      } else {
        setSelectedVehicleId(null);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      message.error("Failed to load group vehicles");
      setGroupVehicles([]);
    }
  };

  const fetchBookings = async () => {
    if (!selectedGroupId || !selectedVehicleId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/booking/Get-Booking-by-group-and-vehicle/${selectedGroupId}/${selectedVehicleId}`);
      const data = res.data?.data || res.data || [];
      
      // Filter out CANCELLED bookings to avoid UI overlap
      const activeBookings = data.filter(booking => booking.status !== 'CANCELLED');
      
      setBookings(activeBookings);
      convertToCalendarEvents(activeBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      message.error("Failed to load bookings");
      setBookings([]);
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const convertToCalendarEvents = (bookingList) => {
    const currentUserId = getCurrentUserId();
    const events = bookingList.map(booking => ({
      id: booking.id,
      title: `${booking.userName || 'User'} - ${booking.status}`,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      backgroundColor: BOOKING_STATUS_COLORS[booking.status] || '#1890ff',
      borderColor: BOOKING_STATUS_COLORS[booking.status] || '#1890ff',
      extendedProps: {
        booking,
        isMyBooking: booking.userId === currentUserId,
      }
    }));
    setCalendarEvents(events);
  };

  const getCurrentUserId = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      return userData.id || userData.userId || null;
    } catch {
      return null;
    }
  };

  const handleEventClick = (info) => {
    const booking = info.event.extendedProps.booking;
    setSelectedBooking(booking);
    setDetailModalVisible(true);
  };

  const handleDateSelect = (selectInfo) => {
    // Open create modal with pre-selected dates
    setCreateModalVisible(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchBookings();
    message.success("Booking created successfully!");
  };

  const handleBookingUpdate = () => {
    setDetailModalVisible(false);
    fetchBookings();
  };

  const selectedGroup = myGroups.find(g => g.id === selectedGroupId);
  const selectedVehicle = groupVehicles.find(v => (v.id || v.vehicleId) === selectedVehicleId);

  return (
    <div className="booking-calendar-page">
      <div className="booking-calendar-content">
        <div className="booking-calendar-header">
          <div className="booking-header-left">
            <Button 
              type="text" 
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{ marginRight: 16 }}
            >
              Back to Home
            </Button>
            <CalendarOutlined className="booking-header-icon" />
            <div>
              <h1 className="booking-header-title">Vehicle Booking Calendar</h1>
              <p className="booking-header-subtitle">Manage your vehicle reservations</p>
            </div>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchBookings()}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={!selectedGroupId || !selectedVehicleId}
            >
              New Booking
            </Button>
          </Space>
        </div>

        <Card className="booking-filter-card">
          <Space size="large" wrap>
            <div>
              <label className="booking-filter-label">Group:</label>
              <Select
                style={{ width: 250 }}
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                placeholder="Select a group"
              >
                {myGroups.map(group => (
                  <Select.Option key={group.id} value={group.id}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="booking-filter-label">Vehicle:</label>
              <Select
                style={{ width: 250 }}
                value={selectedVehicleId}
                onChange={setSelectedVehicleId}
                placeholder="Select a vehicle"
                disabled={!selectedGroupId || groupVehicles.length === 0}
              >
                {groupVehicles.map(vehicle => (
                  <Select.Option key={vehicle.id || vehicle.vehicleId} value={vehicle.id || vehicle.vehicleId}>
                    <Space>
                      <CarOutlined />
                      {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>
            {selectedVehicle && (
              <Tag color="blue">
                {selectedVehicle.make} {selectedVehicle.model}
              </Tag>
            )}
          </Space>
        </Card>

        <Card className="booking-calendar-card">
          <Spin spinning={loading}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={calendarEvents}
              eventClick={handleEventClick}
              select={handleDateSelect}
              height="auto"
              eventContent={(eventInfo) => (
                <div className="booking-event-content">
                  <div className="booking-event-time">
                    {dayjs(eventInfo.event.start).format('HH:mm')}
                  </div>
                  <div className="booking-event-title">
                    {eventInfo.event.extendedProps.isMyBooking && (
                      <Badge color="green" />
                    )}
                    {eventInfo.event.title}
                  </div>
                </div>
              )}
            />
          </Spin>
        </Card>

        <div className="booking-legend">
          <h4>Status Legend:</h4>
          <Space wrap>
            {Object.keys(BOOKING_STATUS_LABELS).map(status => (
              <Tag key={status} color={BOOKING_STATUS_COLORS[status]}>
                {BOOKING_STATUS_LABELS[status]}
              </Tag>
            ))}
            <Tag color="green">
              <Badge color="green" /> My Bookings
            </Tag>
          </Space>
        </div>
      </div>

      <CreateBookingModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        groupId={selectedGroupId}
        vehicleId={selectedVehicleId}
        existingBookings={bookings}
      />

      <BookingDetailModal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        booking={selectedBooking}
        onUpdate={handleBookingUpdate}
        groupId={selectedGroupId}
        vehicleId={selectedVehicleId}
      />
    </div>
  );
};

export default BookingCalendar;
