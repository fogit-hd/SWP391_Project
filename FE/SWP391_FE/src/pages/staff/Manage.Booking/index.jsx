import React, { useEffect, useState } from "react";
import {
  Card,
  Select,
  Button,
  Input,
  List,
  message,
  notification,
  Divider,
  Space,
  Spin,
  Tag,
} from "antd";
import api from "../../../config/axios";
import "./manage-booking.css";

const { Option } = Select;
const { TextArea } = Input;

export default function ManageBooking() {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fileMap, setFileMap] = useState({}); // bookingId -> File
  const [damageDesc, setDamageDesc] = useState("");
  const [damageFile, setDamageFile] = useState(null);
  const [damageSubmitting, setDamageSubmitting] = useState(false);
  const [tripEvents, setTripEvents] = useState([]);
  const [loadingTripEvents, setLoadingTripEvents] = useState(false);
  // track per-booking transient states so UI can hide/show buttons correctly
  const [checkingMap, setCheckingMap] = useState({}); // bookingId -> boolean (in-progress)
  const [checkedInMap, setCheckedInMap] = useState({}); // bookingId -> boolean (checked-in by staff)
  // vehicle detail info (image, specs)
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loadingVehicleDetails, setLoadingVehicleDetails] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get("/CoOwnership/all-groups");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const withContract = await Promise.all(
        list.map(async (g) => {
          try {
            const r = await api.get("/contracts", { params: { groupId: g.id } });
            const arr = Array.isArray(r.data) ? r.data : r.data?.data || [];
            return { ...g, _hasContract: Array.isArray(arr) && arr.length > 0 };
          } catch {
            return { ...g, _hasContract: null };
          }
        })
      );
      setGroups(withContract.filter((g) => g._hasContract));
    } catch (err) {
      console.error(err);
      message.error("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (!selectedGroup) {
      setVehicles([]);
      setSelectedVehicle(null);
      setBookings([]);
      return;
    }
    const vs = selectedGroup.vehicles || [];
    setVehicles(vs);
    setSelectedVehicle(null);
    setBookings([]);
  }, [selectedGroup]);

  const fetchBookings = async (groupId, vehicleId) => {
    if (!groupId || !vehicleId) return;
    setLoadingBookings(true);
    try {
      const r = await api.get(`/booking/Get-Booking-by-group-and-vehicle/${groupId}/${vehicleId}`);
      const data = r.data?.data || [];
      setBookings(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (selectedGroup?.id && selectedVehicle?.id) {
      fetchBookings(selectedGroup.id, selectedVehicle.id);
    }
  }, [selectedGroup, selectedVehicle]);

  useEffect(() => {
    fetchTripEvents();
  }, []);

  const fetchTripEvents = async () => {
    setLoadingTripEvents(true);
    try {
      const r = await api.get(`/trip-events/All-trip-events/staff`);
      const data = Array.isArray(r.data) ? r.data : r.data?.data || [];
      setTripEvents(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load trip events");
      setTripEvents([]);
    } finally {
      setLoadingTripEvents(false);
    }
  };

  const fetchVehicleDetails = async (id) => {
    if (!id) return;
    setLoadingVehicleDetails(true);
    try {
      const r = await api.get(`/Vehicle/get-vehicle-by-id`, { params: { id } });
      // API returns object directly (not wrapped) per sample
      const data = r.data?.data || r.data; // support both shapes
      setVehicleDetails(data || null);
    } catch (err) {
      console.error(err);
      setVehicleDetails(null);
    } finally {
      setLoadingVehicleDetails(false);
    }
  };

  useEffect(() => {
    if (selectedVehicle?.id) {
      fetchVehicleDetails(selectedVehicle.id);
    } else {
      setVehicleDetails(null);
    }
  }, [selectedVehicle]);

  const handleFileChangeForBooking = (bookingId, file) => {
    setFileMap((m) => ({ ...m, [bookingId]: file }));
  };


  const formatDuration = (ms) => {
    if (!ms || ms < 0) return "0h";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
  };

  const doCheck = async (bookingId, endpoint) => {
    const file = fileMap[bookingId];
    if (!bookingId) return message.warning("Missing booking id");
    // If checkout, require a photo from staff
    if (endpoint === "check-out" && !file) {
      alert ("Please upload a photo before checking out.");
      return;
    }

    const fd = new FormData();
    fd.append("BookingId", bookingId);
    if (file) fd.append("Photo", file);

    // optimistic local status update helper
    const optimisticUpdate = (newStatus) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    };

    // mark this booking as in-progress so UI can hide the opposite button
    setCheckingMap((m) => ({ ...m, [bookingId]: true }));

    try {
      // Let the browser set the multipart Content-Type (with boundary).
      const r = await api.post(`/booking/${endpoint}/staff`, fd);

      // Map endpoint to desired status transition
      const newStatus = endpoint === "check-in" ? "in use" : "completed";
      optimisticUpdate(newStatus);

      // update checkedInMap for check-in and clear it for check-out
      if (endpoint === "check-in") {
        setCheckedInMap((m) => ({ ...m, [bookingId]: true }));
      } else if (endpoint === "check-out") {
        setCheckedInMap((m) => {
          const copy = { ...m };
          delete copy[bookingId];
          return copy;
        });
      }

      // clear checking flag
      setCheckingMap((m) => ({ ...m, [bookingId]: false }));

      message.success(r.data?.message || `Booking marked ${newStatus}`);

      // refresh from server to ensure canonical state
      if (selectedGroup?.id && selectedVehicle?.id) {
        // small delay to allow backend to commit
        setTimeout(() => fetchBookings(selectedGroup.id, selectedVehicle.id), 500);
      }
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed");
      // on error clear checking flag
      setCheckingMap((m) => ({ ...m, [bookingId]: false }));
      // on failure, refetch to restore correct state
      if (selectedGroup?.id && selectedVehicle?.id) {
        fetchBookings(selectedGroup.id, selectedVehicle.id);
      }
    }
  };

  const handleCreateDamageReport = async () => {
    if (!selectedVehicle && !bookings.length) return message.warning("Choose vehicle or booking first");
    const fd = new FormData();
    const firstBooking = bookings[0];
    // Backend expects the identifier in the field named "Id" (booking or vehicle id)
    if (firstBooking && firstBooking.id) fd.append("Id", firstBooking.id);
    else if (selectedVehicle?.id) fd.append("Id", selectedVehicle.id);
    if (damageDesc) fd.append("Description", damageDesc);
    if (damageFile) fd.append("Photo", damageFile);
    try {
      setDamageSubmitting(true);
      // Let the browser set the multipart Content-Type (with boundary).
      const r = await api.post(`/trip-events/create-damage-report/staff`, fd);
      const msg = r.data?.message || "Damage report submitted";
      // toast + Ant notification for clearer feedback
      message.success(msg);
      notification.success({
        message: "Damage report submitted",
        description: msg,
      });
      setDamageDesc("");
      setDamageFile(null);
      // refresh trip events so the new report appears in the list
      fetchTripEvents();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to submit report");
      notification.error({
        message: "Submission failed",
        description: err?.response?.data?.message || "Failed to submit report",
      });
    } finally {
      setDamageSubmitting(false);
    }
  };

  return (
    <>
      <div className="manage-booking-page">
        <div className="manage-booking-header-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#eaf4ff", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontWeight: 700 }}>✎</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20 }}>Quản lý đặt chỗ xe</h1>
                <div style={{ color: '#6b7280', fontSize: 13 }}>Quản lý Checkin-Checkout , tạo báo cáo hư hỏng</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* placeholder for actions (refresh/new) kept minimal */}
            </div>
          </div>
        </div>

        <Card className="manage-booking-card">
          <div className="manage-booking-content">
          <Space direction="vertical" style={{ width: "100%" }}>
        <div className="manage-booking-form">
          <div style={{ marginBottom: 8 }}>Select Group (groups with contracts only)</div>
          <Select
            showSearch
            style={{ width: 420 }}
            placeholder={loadingGroups ? "Loading..." : "Select group"}
            loading={loadingGroups}
            value={selectedGroup?.id}
            onChange={(val) => {
              const g = groups.find((x) => x.id === val) || null;
              setSelectedGroup(g);
            }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {groups.map((g) => (
              <Option key={g.id} value={g.id}>
                {g.name}
              </Option>
            ))}
          </Select>

          <div style={{ marginTop: 18, marginBottom: 8 }}>Select Vehicle</div>
          <Select
            style={{ width: 420 }}
            placeholder="Select vehicle"
            value={selectedVehicle?.id}
            onChange={(val) => {
              const v = (vehicles || []).find((x) => x.id === val) || null;
              setSelectedVehicle(v);
            }}
          >
            {(vehicles || []).map((v) => (
              <Option key={v.id} value={v.id}>
                {v.plateNumber || v.plate || v.licensePlate || v.model || v.modelName}
              </Option>
            ))}
          </Select>

          <Divider />
        </div>

        <div>
          {selectedVehicle && (
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 16,
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 12,
              padding: 12
            }}>
              <div style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', background: '#f0f2f5', flexShrink: 0 }}>
                {loadingVehicleDetails ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12 }}>Loading...</div>
                ) : vehicleDetails?.vehicleImageUrl ? (
                  <img src={vehicleDetails.vehicleImageUrl} alt="vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ padding: 8, fontSize: 12, color: '#999' }}>No image</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {vehicleDetails?.plateNumber || selectedVehicle.plateNumber || selectedVehicle.licensePlate || 'Xe'}
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  {(vehicleDetails?.make || selectedVehicle.make || '')} {vehicleDetails?.model || selectedVehicle.model || ''} {vehicleDetails?.modelYear ? `• ${vehicleDetails.modelYear}` : ''}
                </div>
                {vehicleDetails?.color && (
                  <div style={{ fontSize: 12, color: '#555' }}>Màu: {vehicleDetails.color}</div>
                )}
                {vehicleDetails?.batteryCapacityKwh && (
                  <div style={{ fontSize: 12, color: '#555' }}>
                    Pin: {vehicleDetails.batteryCapacityKwh} kWh {vehicleDetails?.rangeKm ? `• Tầm: ${vehicleDetails.rangeKm} km` : ''}
                  </div>
                )}
              </div>
            </div>
          )}
          <h4>Bookings for selected group & vehicle</h4>
          {loadingBookings ? (
            <Spin />
          ) : (
              <List
                dataSource={bookings}
                locale={{ emptyText: "No bookings" }}
                renderItem={(b) => {
                  const normalize = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
                  const rawStatus = normalize(b.status);
                  // Backend sometimes sends 'cancell' instead of 'cancelled'; unify here
                  const st = rawStatus === 'cancell' ? 'cancelled' : rawStatus;
                  const isBooked = st === "booked";
                  const isInUse = st.includes("inuse") || st === "inuse";
                  const isCompleted = st.includes("complete") || st === "completed";
                  const isOvertime = st === "overtime" || st.includes("overtime");

                  const tagColor = isBooked ? "blue" : isInUse ? "orange" : isOvertime ? "purple" : isCompleted ? "green" : "default";
                  const tagText = b.status || "unknown";

                  const checking = !!checkingMap[b.id];
                  const justCheckedIn = !!checkedInMap[b.id];

                  return (
                    <List.Item className={`${st} ${isOvertime ? 'overtime' : ''}`}>
                     
                      <div className="list-item-main" style={{ flex: 1 }}>
                        <div className="meta-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.userName || 'Người đặt: (không rõ)'}</div>
                            {b.userName && (
                              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Mã đặt: {b.id?.slice(0,8)}...</div>
                            )}
                            <div className="time-panel">
                              <div className="time-col">
                                <div className="time-label">Bắt đầu</div>
                                <div className="time-value">{new Date(b.startTime).toLocaleString()}</div>
                                <div className="time-sub">{new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                              <div className="time-col">
                                <div className="time-label">Kết thúc</div>
                                <div className="time-value">{new Date(b.endTime).toLocaleString()}</div>
                                <div className="time-sub">{new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                            </div>
                          </div>
                          <div />
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Input
                            type="file"
                            onChange={(e) => handleFileChangeForBooking(b.id, e.target.files[0])}
                          />
                        </div>
                      </div>
                      <div className="list-item-actions" style={{ display: "flex", gap: 8 }}>
                        <div className="clock-badge" style={{ marginBottom: 8 }}>
                          <span className="clock-icon">⏱</span>
                          <span className="clock-text">
                            {(() => {
                              const start = new Date(b.startTime).getTime();
                              const end = (isInUse || isOvertime) ? Date.now() : (b.endTime ? new Date(b.endTime).getTime() : Date.now());
                              return formatDuration(Math.max(0, end - start));
                            })()}
                          </span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color={tagColor} className={`status-tag ${st}`}>{tagText}</Tag>
                        </div>
                        {/* Always render Check-in button. When booking isn't 'booked' (or already checked-in) show it disabled/gray.
                            When booking is bookable, make it primary (blue). While request is in-progress show 'Checking in...' */}
                        <Button
                          onClick={() => doCheck(b.id, "check-in")}
                          type={isBooked && !checking && !justCheckedIn ? "primary" : undefined}
                          disabled={!isBooked || checking || justCheckedIn}
                        >
                          {checking ? "Checking in..." : "Check-in"}
                        </Button>

                        {/* Hide Check-out while a check-in is in progress for the same booking */}
                        {!checking && (
                          <Button
                            onClick={() => doCheck(b.id, "check-out")}
                            danger
                            disabled={!(isInUse || isOvertime) || !fileMap[b.id]}
                          >
                            Check-out
                          </Button>
                        )}
                      </div>
                    </List.Item>
                  );
                }}
              />
          )}
        </div>

        <Divider />

        <div className="manage-booking-card">
          <h4>Create Damage Report</h4>
          <div style={{ maxWidth: 720 }}>
            <div style={{ marginBottom: 8 }}>
              <TextArea
                rows={3}
                placeholder="Description of damage"
                value={damageDesc}
                onChange={(e) => setDamageDesc(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <Input type="file" onChange={(e) => setDamageFile(e.target.files[0])} />
            </div>
            <div>
              <Button type="primary" onClick={handleCreateDamageReport}>
                Submit Damage Report
              </Button>
            </div>
          </div>
        </div>
        <Divider />

        <div className="manage-booking-card">
          <h4>Trip Events</h4>
          {loadingTripEvents ? (
            <Spin />
          ) : (
            <List
              className="trip-events-list"
              dataSource={tripEvents}
              locale={{ emptyText: "No trip events" }}
              renderItem={(t) => (
                <List.Item>
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <div className="trip-event-media">
                      {t.photosUrl ? (
                        <img src={t.photosUrl} alt="event" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: 12, color: '#9aa' }}>No photo</div>
                      )}
                    </div>
                    <div className="trip-event-body">
                      <div className="trip-event-title">{t.eventType || 'EVENT'}</div>
                      <div className="trip-event-meta">{t.description}</div>
                      <div className="trip-event-meta">Vehicle: {t.vehicleId} {t.bookingId ? `• Booking: ${t.bookingId}` : ''}</div>
                    </div>
                    <div className="trip-event-right">
                      <Tag color={t.eventType === 'DAMAGE' ? 'red' : t.eventType === 'CHECKIN' ? 'blue' : 'green'}>{t.eventType}</Tag>
                      <div className="trip-event-meta">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>

      </Space>
          </div>
        </Card>
      </div>
    </>
  );
}
