import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Select, Space, Spin, message, Tag, Badge, Tooltip, Modal } from "antd";
import { CalendarOutlined, PlusOutlined, ReloadOutlined, CarOutlined, ArrowLeftOutlined, HomeOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import CreateBookingModal from "./CreateBookingModal";
import BookingDetailModal from "./BookingDetailModal";
import BookingListView from "../../components/BookingListView/BookingListView";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "./booking.types";
import "./booking.css";


const BookingManagement = () => {
  const { isAuthenticated, isCoOwner } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupVehicles, setGroupVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [bookings, setBookings] = useState([]);
  
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
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      message.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setDetailModalVisible(true);
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
    <div className="booking-management-page">
      <div className="booking-management-content">
        <div className="booking-management-header">
          <div className="booking-header-left">
            <Button 
              type="text" 
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{ marginRight: 16 }}
            >
              Back to Home
            </Button>
            <UnorderedListOutlined className="booking-header-icon" />
            <div>
              <h1 className="booking-header-title">Vehicle Booking Management</h1>
              <p className="booking-header-subtitle">Manage your vehicle reservations with detailed view</p>
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

        {/* Booking List View */}
        <BookingListView
          bookings={bookings}
          onBookingClick={handleBookingClick}
          loading={loading}
        />
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

export default BookingManagement;
