import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Select, Space, Spin, message, Tag, Badge, Tooltip, Modal, List } from "antd";
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
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingTripHistory, setLoadingTripHistory] = useState(false);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || !isCoOwner) {
      message.error("Bạn phải là Đồng sở hữu để truy cập tính năng đặt lịch");
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
      message.error("Không thể tải danh sách nhóm của bạn");
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
    // load trip history when group selection changes
    if (selectedGroupId) {
      fetchTripHistory();
    } else {
      setTripHistory([]);
    }
  }, [selectedGroupId, selectedVehicleId]);

  // also refresh trip history when groupVehicles update (so vehicleNameById can find names)
  useEffect(() => {
    if (selectedGroupId) fetchTripHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupVehicles]);

  const fetchTripHistory = async () => {
    setLoadingTripHistory(true);
    try {
      const res = await api.get(`/trip-events/History`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      // If we have group vehicles, narrow down to those vehicles belonging to the selected group
      const vehicleIds = (groupVehicles || []).map((v) => v.id || v.vehicleId).filter(Boolean);
      const filtered = vehicleIds.length > 0 ? data.filter((e) => vehicleIds.includes(e.vehicleId)) : data;
      // sort newest first
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTripHistory(filtered.slice(0, 50)); // keep a reasonable number
    } catch (err) {
      console.error("Failed to fetch trip history:", err);
      message.error("Không thể tải lịch sử sự kiện chuyến đi");
      setTripHistory([]);
    } finally {
      setLoadingTripHistory(false);
    }
  };

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
      // refresh trip history after vehicles are loaded so we can resolve vehicle names
      fetchTripHistory();
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      message.error("Không thể tải danh sách xe của nhóm");
      setGroupVehicles([]);
    }
  };

  const fetchBookings = async () => {
    if (!selectedGroupId || !selectedVehicleId) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/booking/Get-Booking-by-group-and-vehicle/${selectedGroupId}/${selectedVehicleId}`);
      const data = res.data?.data || res.data || [];
      
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      message.error("Không thể tải danh sách đặt lịch");
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
    setActiveTab('BOOKED'); // Chuyển sang tab BOOKED khi tạo booking mới
    message.success("Tạo đặt lịch thành công!");
  };

  const handleBookingUpdate = () => {
    setDetailModalVisible(false);
    fetchBookings();
  };

  const selectedGroup = myGroups.find(g => g.id === selectedGroupId);
  const selectedVehicle = groupVehicles.find(v => (v.id || v.vehicleId) === selectedVehicleId);

  const vehicleNameById = (id) => {
    const v = groupVehicles.find((x) => (x.id || x.vehicleId) === id);
    if (!v) return id;
    return `${v.make || v.model || ''} ${v.model || ''} ${v.plateNumber || v.plate || ''}`.trim();
  };

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
              Về trang chủ
            </Button>
            <UnorderedListOutlined className="booking-header-icon" />
            <div>
              <h1 className="booking-header-title">Quản lý đặt lịch xe</h1>
              <p className="booking-header-subtitle">Quản lý việc đặt lịch xe của bạn với chế độ xem chi tiết</p>
            </div>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchBookings()}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={!selectedGroupId || !selectedVehicleId}
            >
              Đặt lịch mới
            </Button>
          </Space>
        </div>

        <Card className="booking-filter-card">
          <Space size="large" wrap>
            <div>
              <label className="booking-filter-label">Nhóm:</label>
              <Select
                style={{ width: 250 }}
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                placeholder="Chọn nhóm"
              >
                {myGroups.map(group => (
                  <Select.Option key={group.id} value={group.id}>
                    {group.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="booking-filter-label">Xe:</label>
              <Select
                style={{ width: 250 }}
                value={selectedVehicleId}
                onChange={setSelectedVehicleId}
                placeholder="Chọn xe"
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
          </Space>
        </Card>

        {/* Booking List View */}
        <BookingListView
          bookings={bookings}
          onBookingClick={handleBookingClick}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
