import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Select, Button, Input, List, message, notification, Space, Spin, Tag, Modal, Descriptions, Image, Divider } from "antd";
import { EyeOutlined } from '@ant-design/icons';
import { StaffBackButton } from '../staffComponents/button.jsx';
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
  const [fileMap, setFileMap] = useState({});
  const fileInputRefs = useRef({});
  const [descriptionMap, setDescriptionMap] = useState({});
  const [damageDesc, setDamageDesc] = useState("");
  const [damageFile, setDamageFile] = useState(null);
  const [damageSubmitting, setDamageSubmitting] = useState(false);
  const [vehicleDetailModalOpen, setVehicleDetailModalOpen] = useState(false);
  const [tripEvents, setTripEvents] = useState([]);
  const [loadingTripEvents, setLoadingTripEvents] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [tripEventsModalOpen, setTripEventsModalOpen] = useState(false);
  const [tripEventFilter, setTripEventFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [checkingMap, setCheckingMap] = useState({});
  const [checkedInMap, setCheckedInMap] = useState({});
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [loadingVehicleDetails, setLoadingVehicleDetails] = useState(false);
  const [vehicleDetailModalOpen, setVehicleDetailModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchGroups(); }, []);
  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get("/CoOwnership/all-groups");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const withContract = await Promise.all(list.map(async g => {
        try {
          const r = await api.get("/contracts", { params: { groupId: g.id } });
          const arr = Array.isArray(r.data) ? r.data : r.data?.data || [];
          return { ...g, _hasContract: Array.isArray(arr) && arr.length > 0 };
        } catch { return { ...g, _hasContract: null }; }
      }));
      setGroups(withContract.filter(g => g._hasContract));
    } catch (err) { console.error(err); message.error("Failed to load groups"); }
    finally { setLoadingGroups(false); }
  };

  useEffect(() => {
    if (!selectedGroup) { setVehicles([]); setSelectedVehicle(null); setBookings([]); return; }
    const vs = selectedGroup.vehicles || []; setVehicles(vs); setSelectedVehicle(null); setBookings([]);
  }, [selectedGroup]);

  const fetchBookings = async (groupId, vehicleId) => {
    if (!groupId || !vehicleId) return;
    setLoadingBookings(true);
    try {
      const r = await api.get(`/booking/Get-Booking-by-group-and-vehicle/${groupId}/${vehicleId}`);
      setBookings(r.data?.data || []);
    } catch (err) { console.error(err); message.error("Failed to load bookings"); setBookings([]); }
    finally { setLoadingBookings(false); }
  };
  useEffect(() => { if (selectedGroup?.id && selectedVehicle?.id) fetchBookings(selectedGroup.id, selectedVehicle.id); }, [selectedGroup, selectedVehicle]);

  useEffect(() => { fetchTripEvents(); }, []);
  const fetchTripEvents = async () => {
    setLoadingTripEvents(true);
    try {
      const r = await api.get(`/trip-events/History/staff`);
      setTripEvents(Array.isArray(r.data) ? r.data : r.data?.data || []);
    } catch (err) { console.error(err); message.error("Failed to load trip events"); setTripEvents([]); }
    finally { setLoadingTripEvents(false); }
  };

  const fetchVehicleDetails = async (id) => {
    if (!id) return; setLoadingVehicleDetails(true);
    try {
      const r = await api.get(`/Vehicle/get-vehicle-by-id`, { params: { id } });
      const data = r.data?.data || r.data; setVehicleDetails(data || null);
    } catch (err) { console.error(err); setVehicleDetails(null); }
    finally { setLoadingVehicleDetails(false); }
  };
  useEffect(() => { if (selectedVehicle?.id) fetchVehicleDetails(selectedVehicle.id); else setVehicleDetails(null); }, [selectedVehicle]);

  const appendFilesForBooking = (bookingId, fileList) => {
    const newFiles = Array.from(fileList || []); if (!newFiles.length) return;
    setFileMap(m => ({ ...m, [bookingId]: [...(m[bookingId] || []), ...newFiles] }));
  };
  const removeFileForBooking = (bookingId, index) => {
    setFileMap(m => { const copy = [...(m[bookingId] || [])]; copy.splice(index,1); return { ...m, [bookingId]: copy }; });
  };
  const handleDescriptionChangeForBooking = (bookingId, desc) => { setDescriptionMap(m => ({ ...m, [bookingId]: desc })); };

  const formatDuration = (ms) => { if (!ms || ms < 0) return "0h"; const totalMin = Math.floor(ms / 60000); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return `${h}h ${m}m`; };

  const doCheck = async (bookingId, endpoint) => {
    const files = fileMap[bookingId] || [];
    if (!bookingId) { toast.error("Thiếu mã đặt chỗ"); return; }
    if ((endpoint === "check-in" || endpoint === "check-out") && (!files || files.length === 0)) { toast.warning("Thêm ảnh là bắt buộc !!"); return; }
    const fd = new FormData(); fd.append("BookingId", bookingId); const desc = descriptionMap[bookingId]; if (desc) fd.append("Description", desc); if (files && files.length) files.forEach(f => fd.append("Photo", f));
    const optimisticUpdate = (newStatus) => { setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)); };
    setCheckingMap(m => ({ ...m, [bookingId]: true }));
    try {
      const r = await api.post(`/booking/${endpoint}/staff`, fd);
      const newStatus = endpoint === "check-in" ? "in use" : "completed"; optimisticUpdate(newStatus);
      if (endpoint === "check-in") setCheckedInMap(m => ({ ...m, [bookingId]: true }));
      else if (endpoint === "check-out") setCheckedInMap(m => { const copy = { ...m }; delete copy[bookingId]; return copy; });
      setCheckingMap(m => ({ ...m, [bookingId]: false }));
      const successMsg = r.data?.message || (endpoint === 'check-in' ? 'Check-in thành công' : 'Check-out thành công');
      message.success(successMsg);
      toast.success(successMsg);
      setFileMap(m => ({ ...m, [bookingId]: [] })); setDescriptionMap(m => ({ ...m, [bookingId]: '' }));
      if (selectedGroup?.id && selectedVehicle?.id) setTimeout(() => fetchBookings(selectedGroup.id, selectedVehicle.id), 500);
    } catch (err) {
      console.error(err); const backendMsg = err?.response?.data?.message;
      if (backendMsg) { if (endpoint === "check-in") toast.warning(backendMsg); else toast.error(backendMsg); } else toast.error("Thao tác thất bại");
      setCheckingMap(m => ({ ...m, [bookingId]: false })); if (selectedGroup?.id && selectedVehicle?.id) fetchBookings(selectedGroup.id, selectedVehicle.id);
    }
  };

  const handleCreateDamageReport = async () => {
    if (!selectedVehicle && !bookings.length) return message.warning("Choose vehicle or booking first");
    if (!damageFiles || damageFiles.length === 0) { toast.warning("Thêm ảnh là bắt buộc !!"); return; }
    const fd = new FormData(); const firstBooking = bookings[0]; if (firstBooking && firstBooking.id) fd.append("Id", firstBooking.id); else if (selectedVehicle?.id) fd.append("Id", selectedVehicle.id);
    if (damageDesc) fd.append("Description", damageDesc); if (damageFiles && damageFiles.length > 0) damageFiles.forEach(f => fd.append("Photo", f));
    try {
      setDamageSubmitting(true); await api.post(`/trip-events/create-damage-report/staff`, fd); toast.success("tạo báo hư hỏng thành công"); setDamageDesc(""); setDamageFiles([]); fetchTripEvents();
    } catch (err) {
      console.error(err); message.error(err?.response?.data?.message || "Failed to submit report"); notification.error({ message: "Submission failed", description: err?.response?.data?.message || "Failed to submit report" });
    } finally { setDamageSubmitting(false); }
  };

  return (
    <>
      <div className="manage-booking-page">
        <div className="manage-booking-header-card">
          <div style={{ display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center', gap:24 }}>
            <StaffBackButton inline />
            <div style={{ display: "flex", gap: 12, alignItems: "center", flex:1, justifyContent:'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#eaf4ff", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontWeight: 700 }}>✎</div>
              <div style={{ textAlign:'center' }}>
                <h1 style={{ margin: 0, fontSize: 20 }}>Quản lý đặt chỗ xe</h1>
                <div style={{ color: '#6b7280', fontSize: 13 }}>Quản lý Checkin-Checkout , tạo báo cáo hư hỏng</div>
              </div>
            </div>
            <div style={{ width:120 }} />
          </div>
        </div>

        <div className="detached-row">
          <div className="selector-oval staff-oval">
            <div style={{ marginBottom: 8 }}>Chọn nhóm</div>
            <Select
              showSearch
              style={{ width: 360 }}
              placeholder={loadingGroups ? "Loading..." : "Chọn nhóm"}
              loading={loadingGroups}
              value={selectedGroup?.id}
              onChange={(val) => { const g = groups.find(x => x.id === val) || null; setSelectedGroup(g); }}
              filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            >
              {groups.map(g => (<Option key={g.id} value={g.id}>{g.name}</Option>))}
            </Select>
            <div style={{ marginTop: 18, marginBottom: 8 }}>Chọn xe</div>
            <Select
              style={{ width: 360 }}
              placeholder="Chọn xe"
              value={selectedVehicle?.id}
              onChange={(val) => { const v = (vehicles || []).find(x => x.id === val) || null; setSelectedVehicle(v); }}
            >
              {(vehicles || []).map(v => (<Option key={v.id} value={v.id}>{(v.make || '') + ' ' + (v.model || v.modelName || '')}</Option>))}
            </Select>
          </div>
          {selectedVehicle && (
            <div className="vehicle-info-oval staff-oval">
              <div className="vehicle-info-body">
                <div className="vehicle-info-header">
                  <div className="vehicle-title">{(vehicleDetails?.make || selectedVehicle.make || '')} {(vehicleDetails?.model || selectedVehicle.model || '')}</div>
                  <EyeOutlined style={{ fontSize:18, cursor:'pointer', color:'#555' }} title="Xem chi tiết" onClick={()=> setVehicleDetailModalOpen(true)} />
                </div>
                {vehicleDetails?.modelYear && (<div className="vehicle-line">Năm: {vehicleDetails.modelYear}</div>)}
                {vehicleDetails?.color && (<div className="vehicle-line">Màu: {vehicleDetails.color}</div>)}
                {vehicleDetails?.batteryCapacityKwh && (
                  <div className="vehicle-line">Pin: {vehicleDetails.batteryCapacityKwh} kWh {vehicleDetails?.rangeKm ? `• Tầm: ${vehicleDetails.rangeKm} km` : ''}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedGroup && selectedVehicle && (
          <div className="bookings-oval staff-oval">
            <div className="section-header">
              <h4 style={{ margin: 0 }}>Lịch booking</h4>
              {bookings.length > 0 && (
                <Space size="middle">
                  <span style={{ fontSize:12 }}>Lọc trạng thái:</span>
                  <Select size="small" value={bookingStatusFilter} onChange={setBookingStatusFilter} style={{ width: 140 }}>
                    <Option value="all">Tất cả</Option>
                    <Option value="booked">Booked</Option>
                    <Option value="inuse">In Use</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="overtime">Overtime</Option>
                  </Select>
                  <Button size="small" onClick={()=> setBookingStatusFilter('all')}>Clear</Button>
                </Space>
              )}
            </div>
            {loadingBookings ? <Spin /> : (
              <List
                dataSource={bookings.filter(b => {
                  const sRaw = (b.status || '').toLowerCase();
                  if (sRaw === 'cancelled' || sRaw === 'cancell') return false;
                  if (bookingStatusFilter === 'all') return true;
                  const s = sRaw.replace(/[^a-z0-9]+/g,'');
                  if (bookingStatusFilter === 'inuse') return s === 'inuse';
                  return s.includes(bookingStatusFilter);
                })}
                locale={{ emptyText: "No bookings" }}
                renderItem={(b) => {
                  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();
                  const rawStatus = normalize(b.status);
                  const st = rawStatus === 'cancell' ? 'cancelled' : rawStatus;
                  const isBooked = st === 'booked';
                  const isInUse = st.includes('inuse') || st === 'inuse';
                  const isCompleted = st.includes('complete') || st === 'completed';
                  const isOvertime = st === 'overtime' || st.includes('overtime');
                  const tagColor = isBooked ? 'blue' : isInUse ? 'orange' : isOvertime ? 'purple' : isCompleted ? 'green' : 'default';
                  const tagText = b.status || 'unknown';
                  const checking = !!checkingMap[b.id];
                  const justCheckedIn = !!checkedInMap[b.id];
                  return (
                    <List.Item className={`${st} ${isOvertime ? 'overtime' : ''}`}>
                      <div className="list-item-main" style={{ flex:1 }}>
                        <div className="meta-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, marginBottom:4 }}>{b.userName || 'Người đặt: (không rõ)'}</div>
                            {b.userName && (<div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>Mã đặt: {b.id}</div>)}
                            <div className="time-panel">
                              <div className="time-col">
                                <div className="time-label">Bắt đầu</div>
                                <div className="time-value">{new Date(b.startTime).toLocaleString()}</div>
                                <div className="time-sub">{new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                              </div>
                              <div className="time-col">
                                <div className="time-label">Kết thúc</div>
                                <div className="time-value">{new Date(b.endTime).toLocaleString()}</div>
                                <div className="time-sub">{new Date(b.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {(isBooked || isInUse || isOvertime) && (
                          <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                            <TextArea rows={2} placeholder="Mô tả (tuỳ chọn)" value={descriptionMap[b.id] || ''} onChange={(e)=> handleDescriptionChangeForBooking(b.id, e.target.value)} />
                            <div style={{display:'flex',flexDirection:'column',gap:6}}>
                              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                                {(fileMap[b.id] || []).map((f, idx) => (
                                  <div key={idx} style={{position:'relative',padding:'4px 8px',background:'#f5f5f5',borderRadius:4,fontSize:12}}>
                                    <span style={{maxWidth:120,display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                                    <Button size="small" danger style={{marginLeft:6}} onClick={()=>removeFileForBooking(b.id, idx)}>X</Button>
                                  </div>
                                ))}
                                {!(fileMap[b.id] && fileMap[b.id].length) && (<span style={{fontSize:12,color:'#999'}}>Chưa có ảnh</span>)}
                              </div>
                              <input ref={el => { fileInputRefs.current[b.id] = el; }} type="file" multiple style={{display:'none'}} onChange={(e)=> { appendFilesForBooking(b.id, e.target.files); e.target.value=''; }} />
                              <Button size="small" onClick={()=> fileInputRefs.current[b.id]?.click()}>Thêm ảnh</Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="list-item-actions" style={{ display:'flex', gap:8 }}>
                        <div className="clock-badge" style={{ marginBottom:8 }}>
                          <span className="clock-icon">⏱</span>
                          <span className="clock-text">{(() => { const start = new Date(b.startTime).getTime(); const end = (isInUse || isOvertime) ? Date.now() : (b.endTime ? new Date(b.endTime).getTime() : Date.now()); return formatDuration(Math.max(0, end - start)); })()}</span>
                        </div>
                        <div style={{ marginBottom:8 }}><Tag color={tagColor} className={`status-tag ${st}`}>{tagText}</Tag></div>
                        <Button onClick={() => doCheck(b.id, "check-in")} type={isBooked && !checking && !justCheckedIn ? "primary" : undefined} disabled={!isBooked || checking || justCheckedIn}>{checking ? "Checking in..." : "Check-in"}</Button>
                        <Button
                          onClick={() => doCheck(b.id, "check-out")}
                          danger
                          type={(isInUse || isOvertime) && !checking ? "primary" : undefined}
                          disabled={!(isInUse || isOvertime) || checking}
                        >
                          {checking ? "Checking out..." : "Check-out"}
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
            {(() => {
              const visibleBookings = bookings.filter(b => {
                const raw = (b.status || '').toLowerCase();
                if (raw === 'cancelled' || raw === 'cancell') return false;
                if (bookingStatusFilter === 'all') return true;
                const norm = raw.replace(/[^a-z0-9]+/g,'');
                if (bookingStatusFilter === 'inuse') return norm === 'inuse';
                return norm.includes(bookingStatusFilter);
              });
            if (visibleBookings.length === 0) return null; // nothing visible -> no button
            // Determine latest among the VISIBLE list (endTime fallback startTime)
            const latest = [...visibleBookings]
              .sort((a,b)=> new Date(b.endTime || b.startTime) - new Date(a.endTime || a.startTime))[0];
            if (!latest) return null;
            const st = (latest.status || '').toLowerCase().replace(/[^a-z0-9]+/g,'');
            const latestIsCompleted = st.includes('complete');
            if (!latestIsCompleted) return null; // only show if the latest visible booking is completed
            return (
              <div style={{ marginTop: 16 }}>
                <Button type="dashed" onClick={()=> setDamageModalOpen(true)}>
                   báo cáo hư hỏng
                </Button>
              </div>
            );
          })()}
        </div>
        <Divider />
        <div style={{ display:'flex', justifyContent:'flex-end', gap: 8, marginBottom: 8 }}>
          <Button onClick={() => {
            if (selectedVehicle?.id) {
              fetchDamageReportsByVehicle(selectedVehicle.id);
              setDamageReportsModalOpen(true);
            } else {
              message.warning('Vui lòng chọn xe trước');
            }
          }}>Báo cáo hư hỏng xe</Button>
          <Button onClick={()=> setTripEventsModalOpen(true)}>lịch sử </Button>
        </div>

        <Modal title="Báo cáo hư hỏng" open={damageModalOpen} onCancel={() => setDamageModalOpen(false)} onOk={handleCreateDamageReport} okText="Gửi báo cáo" confirmLoading={damageSubmitting}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea rows={4} placeholder="Mô tả hư hỏng" value={damageDesc} onChange={(e) => setDamageDesc(e.target.value)} />
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {(damageFiles || []).map((f, idx) => (
                  <div key={idx} style={{position:'relative',padding:'4px 8px',background:'#f5f5f5',borderRadius:4,fontSize:12}}>
                    <span style={{maxWidth:120,display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                    <Button size="small" danger style={{marginLeft:6}} onClick={()=>{ const copy = [...damageFiles]; copy.splice(idx,1); setDamageFiles(copy); }}>X</Button>
                  </div>
                ))}
                {!(damageFiles && damageFiles.length) && (<span style={{fontSize:12,color:'#999'}}>Chưa có ảnh</span>)}
              </div>
              <input type="file" multiple style={{display:'none'}} id="damage-file-input" onChange={(e)=> { const newFiles = Array.from(e.target.files || []); if (newFiles.length) setDamageFiles(prev => [...(prev||[]), ...newFiles]); e.target.value=''; }} />
              <Button size="small" onClick={()=> document.getElementById('damage-file-input')?.click()}>Thêm ảnh</Button>
            </div>
          </Space>
        </Modal>

        <Modal title="Chi tiết xe" open={vehicleDetailModalOpen} onCancel={() => setVehicleDetailModalOpen(false)} footer={<Button onClick={()=> setVehicleDetailModalOpen(false)}>Đóng</Button>} width={800}>
          {vehicleDetails ? (
            <div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID xe" span={2}>{vehicleDetails.id}</Descriptions.Item>
                <Descriptions.Item label="Biển số">{vehicleDetails.plateNumber}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái"><Tag color="green">Đã duyệt</Tag></Descriptions.Item>
                <Descriptions.Item label="Hãng xe">{vehicleDetails.make}</Descriptions.Item>
                <Descriptions.Item label="Model">{vehicleDetails.model}</Descriptions.Item>
                <Descriptions.Item label="Năm">{vehicleDetails.modelYear}</Descriptions.Item>
                <Descriptions.Item label="Màu sắc">{vehicleDetails.color || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Pin (kWh)">{vehicleDetails.batteryCapacityKwh}</Descriptions.Item>
                <Descriptions.Item label="Phạm vi (km)">{vehicleDetails.rangeKm}</Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop:16 }}>
                <Space direction="vertical" size="middle" style={{ width:'100%' }}>
                  <div>
                    <div style={{ fontWeight:'bold', marginBottom:8 }}>Hình ảnh xe:</div>
                    {vehicleDetails.vehicleImageUrl ? (
                      <Image src={vehicleDetails.vehicleImageUrl} alt="Vehicle" style={{ maxWidth:'100%', maxHeight:300, objectFit:'cover' }} />
                    ) : (
                      <div style={{ width:'100%', height:200, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f0f0', border:'1px dashed #d9d9d9', borderRadius:8 }}>
                        <span style={{ color:'#999' }}>Chưa có hình ảnh xe</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight:'bold', marginBottom:8 }}>Giấy đăng ký xe:</div>
                    {vehicleDetails.registrationPaperUrl ? (
                      <Image src={vehicleDetails.registrationPaperUrl} alt="Registration" style={{ maxWidth:'100%', maxHeight:300, objectFit:'cover' }} />
                    ) : (
                      <div style={{ width:'100%', height:200, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f0f0', border:'1px dashed #d9d9d9', borderRadius:8 }}>
                        <span style={{ color:'#999' }}>Chưa có giấy đăng ký xe</span>
                      </div>
                    )}
                  </div>
                </Space>
              </div>
            </div>
          ) : (<Spin />)}
        </Modal>

        <Modal title="Lịch sử sự kiện chuyến đi" open={tripEventsModalOpen} onCancel={()=> setTripEventsModalOpen(false)} footer={<Button onClick={()=> setTripEventsModalOpen(false)}>Đóng</Button>} width={700}>
          <Space direction="vertical" style={{ width:'100%' }} size="middle">
            <Space>
              <span>Bộ lọc:</span>
              <Select size="small" value={tripEventFilter} onChange={setTripEventFilter} style={{ width:160 }}>
                <Option value="all">Tất cả</Option>
                <Option value="checkin">Check-in</Option>
                <Option value="checkout">Check-out</Option>
                <Option value="damage">Damage</Option>
              </Select>
              <Button size="small" onClick={()=> setTripEventFilter('all')}>Clear</Button>
            </Space>
            {loadingTripEvents ? <Spin /> : (
              <List
                className="trip-events-list"
                dataSource={tripEvents.filter(t => { const type = (t.eventType || '').toLowerCase(); return tripEventFilter === 'all' || type === tripEventFilter; })}
                locale={{ emptyText: 'No events' }}
                renderItem={(t) => {
                  let photos = [];
                  try {
                    if (t.photosUrl) {
                      if (t.photosUrl.trim().startsWith('[')) { photos = JSON.parse(t.photosUrl); } else { photos = [t.photosUrl]; }
                    }
                  } catch { photos = [t.photosUrl]; }
                  if (!Array.isArray(photos)) photos = [photos];
                  return (
                    <List.Item>
                      <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                        <div className="trip-event-media">
                          {photos.length > 0 ? (
                            <Image.PreviewGroup>
                              <Image src={photos[0]} alt="event" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              {photos.slice(1).map((p, idx) => (<Image key={idx} src={p} style={{ display:'none' }} />))}
                            </Image.PreviewGroup>
                          ) : (<div style={{ fontSize:12, color:'#9aa' }}>No photo</div>)}
                        </div>
                        <div className="trip-event-body">
                          <div className="trip-event-title">{t.eventType || 'EVENT'}</div>
                          <div className="trip-event-meta">Xe: {t.vehicleName || 'N/A'} <br/> Biển số: {t.vehiclePlate || 'N/A'}<br/>{ <>Mô tả hư hỏng : {t.description}<br/></>}Nhân viên đã tạo: {t.staffName || 'N/A'}</div>
                        </div>
                        <div className="trip-event-right">
                          <Tag color={t.eventType === 'DAMAGE' ? 'red' : t.eventType === 'CHECKIN' ? 'blue' : 'green'}>{t.eventType}</Tag>
                          <div className="trip-event-meta">{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Space>
        </Modal>

        <Modal
          title="Báo cáo hư hỏng xe"
          open={damageReportsModalOpen}
          onCancel={() => setDamageReportsModalOpen(false)}
          footer={<Button onClick={() => setDamageReportsModalOpen(false)}>Đóng</Button>}
          width={700}
        >
          {loadingDamageReports ? <Spin /> : (
            <List
              dataSource={damageReports}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    <div style={{ width: 80, height: 80, flexShrink: 0, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                      {item.photosUrl ? (
                        <img src={item.photosUrl} alt="damage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: 12, color: '#999', padding: 8 }}>No photo</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {item.vehicleName} - {item.vehiclePlate}
                      </div>
                      <div style={{ color: '#666', marginBottom: 4 }}>{item.description}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        Nhân viên: {item.staffName} • {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có báo cáo hư hỏng nào' }}
            />
          )}
        </Modal>

      </Space>
          </div>
        </Card>
      </div>
    </>
  );
}