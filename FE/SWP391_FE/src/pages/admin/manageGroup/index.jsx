import React, { useState, useEffect, useMemo } from "react";
import {
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Layout,
  theme,
  Table,
  Card,
  Button,
  Spin,
  message,
  Modal,
  List,
  Avatar,
  Tag,
  Tabs,
  Popconfirm,
} from "antd";
import api from "../../../config/axios";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import "./manageGroup.css";

const { Header, Content, Footer } = Layout;

export default function ManageGroup() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [viewKey, setViewKey] = useState("card");
  const [current, setCurrent] = useState(0);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive

  // Local hide store for admin view (no real delete API per requirements)
  const ADMIN_HIDDEN_KEY = "admin_hidden_groups";
  const getHiddenIds = () => {
    try {
      const raw = localStorage.getItem(ADMIN_HIDDEN_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
      return new Set();
    }
  };
  const addHiddenId = (id) => {
    try {
      const set = getHiddenIds();
      set.add(id);
      localStorage.setItem(ADMIN_HIDDEN_KEY, JSON.stringify([...set]));
    } catch {}
  };

  // Determine if a group already has any contract based on common backend shapes
  const hasAnyContract = (g) => {
    if (!g) return false;
    if (typeof g.hasContract === "boolean") return g.hasContract;
    if (Array.isArray(g.contracts)) return g.contracts.length > 0;
    if (typeof g.contractCount === "number") return g.contractCount > 0;
    if (g.latestContract || g.contract) return true;
    // Fallback: some APIs might already map this to isActive
    return !!g.isActive;
  };

  const isActiveByContract = (g) =>
    g?._hasContract !== null && g?._hasContract !== undefined
      ? g._hasContract
      : hasAnyContract(g);

  const filteredGroups = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = groups.filter((g) =>
      q ? (g.name || "").toLowerCase().includes(q) : true
    );
    if (statusFilter === "active") return list.filter((g) => isActiveByContract(g));
    if (statusFilter === "inactive")
      return list.filter((g) => !isActiveByContract(g));
    return list;
  }, [groups, searchText, statusFilter]);

  const deleteGroup = async (group) => {
    if (!group?.id) return;
    // Hide in UI and persist in localStorage; no backend call
    addHiddenId(group.id);
    setGroups((prev) => prev.filter((x) => x.id !== group.id));
    message.success("Group hidden in this view");
  };

  // Helpers: normalize API fields and format dates safely
  const normalizeGroups = (arr) =>
    (arr || []).map((g) => ({
      ...g,
      createdBy:
        g?.createdBy ??
        g?.created_by ??
        g?.createdById ??
        g?.createdByID ??
        g?.createdby,
      createdAt: g?.createdAt ?? g?.created_at ?? g?.createdDate,
      updatedAt: g?.updatedAt ?? g?.updated_at ?? g?.updatedDate,
    }));

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        // Not a parsable date string; show raw value
        return String(val);
      }
      return d.toLocaleString();
    } catch {
      return String(val);
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await api.get("/CoOwnership/all-groups");
        const payload = res.data?.data ?? res.data;
        let list = [];
        if (Array.isArray(payload)) list = payload;
        else if (Array.isArray(payload?.items)) list = payload.items;
        else list = [];

        // helper to check if a group has ANY contract (DRAFT/APPROVED/SIGNING/...)
        const fetchHasContract = async (groupId) => {
          const normalize = (r) =>
            Array.isArray(r?.data)
              ? r.data
              : Array.isArray(r?.data?.data)
              ? r.data.data
              : [];
          try {
            // Try without status to get all contracts for the group
            const rAll = await api.get("/contracts", { params: { groupId } });
            const all = normalize(rAll);
            if (Array.isArray(all) && all.length > 0) return true;
          } catch {
            // ignore and try per-status fallbacks
          }
          const statuses = [
            "DRAFT",
            "APPROVED",
            "APPROVE",
            "SIGNING",
            "PENDING_REVIEW",
          ];
          try {
            const results = await Promise.all(
              statuses.map((st) =>
                api
                  .get("/contracts", { params: { groupId, status: st } })
                  .then((r) => normalize(r))
                  .catch(() => [])
              )
            );
            return results.some((arr) => Array.isArray(arr) && arr.length > 0);
          } catch {
            return null; // unknown
          }
        };

        const mapWithConcurrency = async (items, limit, mapper) => {
          const results = new Array(items.length);
          let i = 0;
          const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
            while (i < items.length) {
              const idx = i++;
              /* eslint-disable no-await-in-loop */
              results[idx] = await mapper(items[idx], idx);
            }
          });
          await Promise.all(workers);
          return results;
        };

        const normalized = normalizeGroups(list);
        // filter out locally hidden groups for admin
        const hidden = getHiddenIds();
        const filtered = normalized.filter((g) => !hidden.has(g.id));
        // Enrich groups with _hasContract flag (concurrent)
        const enriched = await mapWithConcurrency(filtered, 5, async (g) => {
          const hasC = await fetchHasContract(g.id);
          return { ...g, _hasContract: hasC };
        });
        setGroups(enriched);
      } catch (err) {
        console.error("Failed to fetch groups", err);
        message.error("Cannot fetch groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const fetchVehiclesForGroup = async (groupId) => {
    if (!groupId) return;
    setVehiclesLoading(true);
    try {
      const res = await api.get(`/CoOwnership/${groupId}/vehicles`);
      const payload = res.data?.data ?? res.data;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.items)) list = payload.items;
      else if (Array.isArray(payload?.vehicles)) list = payload.vehicles;
      setSelectedVehicles(list);
    } catch (err) {
      console.error("Cannot fetch vehicles for group:", groupId, err);
      message.error("Cannot fetch vehicles for this group");
      setSelectedVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a
          onClick={() => {
            setSelected(record);
            setDetailsVisible(true);
            setSelectedVehicles(record?.vehicles || []);
            fetchVehiclesForGroup(record?.id);
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Group ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
    },
    {
      title: "Owner",
      dataIndex: ["members"],
      key: "owner",
      render: (members) => {
        if (!members || members.length === 0) return "-";
        const owner =
          members.find((m) => m.roleInGroup === "OWNER") || members[0];
        return owner?.fullName || owner?.userId || "-";
      },
    },
   

    {
      title: "Members",
      dataIndex: ["members"],
      key: "membersCount",
      render: (members) => (members ? members.length : 0),
    },
    {
      title: "Vehicles",
      dataIndex: ["vehicles"],
      key: "vehiclesCount",
      render: (vehicles) => (vehicles ? vehicles.length : 0),
    },
    {
      title: "Active",
      key: "activeByContract",
      render: (_, record) =>
        (() => {
          const activeByContract =
            record?._hasContract !== null && record?._hasContract !== undefined
              ? record._hasContract
              : hasAnyContract(record);
          return activeByContract ? (
            <Tag color="green" className="status-tag">Active</Tag>
          ) : (
            <Tag color="red" className="status-tag">Inactive</Tag>
          );
        })(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="small"
            onClick={() => {
              setSelected(record);
              setDetailsVisible(true);
              setSelectedVehicles(record?.vehicles || []);
              fetchVehiclesForGroup(record?.id);
            }}
          >
            Details
          </Button>
          {(() => {
            const activeByContract = isActiveByContract(record);
            return !activeByContract ? (
            <Popconfirm
              title="Delete this group?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteGroup(record)}
            >
              <Button size="small" danger>Delete</Button>
            </Popconfirm>
            ) : null;
          })()}
        </div>
      ),
    },
    
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-groups"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "0 16px" }}>
          <div style={{ margin: "16px 0" }}>
            <h2>Co-ownership Groups</h2>
          </div>

          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Card
              title={"Manage groups"}
              extra={
                <Button
                  onClick={() => {
                    (async () => {
                      setLoading(true);
                      try {
                        const res = await api.get("/CoOwnership/all-groups");
                        const payload = res.data?.data ?? res.data;
                        const list = Array.isArray(payload)
                          ? payload
                          : Array.isArray(payload?.items)
                          ? payload.items
                          : [];
                        const normalized = normalizeGroups(list);
                        const hidden = getHiddenIds();
                        const filtered = normalized.filter((g) => !hidden.has(g.id));
                        // Reuse the same enrichment logic used on initial load
                        const mapWithConcurrency = async (items, limit, mapper) => {
                          const results = new Array(items.length);
                          let i = 0;
                          const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
                            while (i < items.length) {
                              const idx = i++;
                              /* eslint-disable no-await-in-loop */
                              results[idx] = await mapper(items[idx], idx);
                            }
                          });
                          await Promise.all(workers);
                          return results;
                        };
                        const enriched = await mapWithConcurrency(filtered, 5, async (g) => {
                          const hasC = await fetchHasContract(g.id);
                          return { ...g, _hasContract: hasC };
                        });
                        setGroups(enriched);
                        setCurrent(0);
                      } catch (e) {
                        message.error("Cannot fetch groups");
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                >
                  Refresh
                </Button>
              }
            >
              {/* Filters */}
              <div style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <input
                  type="text"
                  placeholder="Search by group name"
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setCurrent(0); }}
                  style={{ padding: 8, borderRadius: 6, border: "1px solid #d9d9d9", minWidth: 240 }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrent(0); }}
                    style={{ padding: 8, borderRadius: 6, border: "1px solid #d9d9d9" }}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Button onClick={() => { setSearchText(""); setStatusFilter("all"); setCurrent(0); }}>Clear</Button>
                </div>
              </div>
              <Tabs
                activeKey={viewKey}
                onChange={setViewKey}
                items={[
                  {
                    key: "card",
                    label: "Card view",
                    children: loading ? (
                      <div style={{ textAlign: "center", padding: 24 }}>
                        <Spin />
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div>No groups</div>
                    ) : (
                      <div>
                        {(() => {
                          const g = filteredGroups[Math.min(current, Math.max(filteredGroups.length - 1, 0))];
                          const owner =
                            g?.members?.find(
                              (m) => m.roleInGroup === "OWNER"
                            ) || g?.members?.[0];
                          return (
                            <Card
                              size="small"
                              className="manage-group-card"
                              style={{ marginBottom: 12 }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <h3
                                  style={{ margin: 0, cursor: "pointer" }}
                                  onClick={() => {
                                    setSelected(g);
                                    setDetailsVisible(true);
                                    setSelectedVehicles(g?.vehicles || []);
                                    fetchVehiclesForGroup(g?.id);
                                  }}
                                >
                                  {g?.name}
                                </h3>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  {(() => {
                                    const activeByContract = isActiveByContract(g);
                                    return (
                                      <Tag color={activeByContract ? "green" : "red"}>
                                        {activeByContract ? "Active" : "Inactive"}
                                      </Tag>
                                    );
                                  })()}
                                  {/* Details button removed as requested */}
                                </div>
                              </div>
                              <div
                                style={{
                                  marginTop: 8,
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 8,
                                }}
                              >
                                <div>
                                  <strong>ID:</strong> {g?.id}
                                </div>
                                <div>
                                  <strong>Owner:</strong>{" "}
                                  {owner?.fullName || owner?.userId || "-"}
                                </div>
                                <div>
                                  <strong>Members:</strong>{" "}
                                  {g?.members ? g.members.length : 0}
                                </div>
                                <div>
                                  <strong>Vehicles:</strong>{" "}
                                  {g?.vehicles ? g.vehicles.length : 0}
                                </div>
                              </div>
                            </Card>
                          );
                        })()}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 12,
                          }}
                        >
                          <Button
                            icon={<LeftOutlined />}
                            onClick={() => setCurrent((i) => (i === 0 ? filteredGroups.length - 1 : i - 1))}
                          />
                          <span>
                            Group {Math.min(current + 1, filteredGroups.length)} of {filteredGroups.length}
                          </span>
                          <Button
                            icon={<RightOutlined />}
                            onClick={() => setCurrent((i) => (i + 1) % filteredGroups.length)}
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "table",
                    label: "Table view",
                    children: loading ? (
                      <div style={{ textAlign: "center", padding: 24 }}>
                        <Spin />
                      </div>
                    ) : (
                      <Table
                        dataSource={filteredGroups.map((g) => ({ ...g, key: g.id }))}
                        columns={columns}
                        pagination={{ pageSize: 10 }}
                      />
                    ),
                  },
                ]}
              />
            </Card>

            <Modal
              title={selected ? selected.name : "Group details"}
              open={detailsVisible}
              onCancel={() => setDetailsVisible(false)}
              footer={
                <Button onClick={() => setDetailsVisible(false)}>Close</Button>
              }
              width={800}
              className="manage-group-modal"
            >
              {selected ? (
                <div>
                  <h3>Members</h3>
                  <List
                    itemLayout="horizontal"
                    dataSource={selected.members || []}
                    renderItem={(m) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar>{(m.fullName || "?").slice(0, 1)}</Avatar>
                          }
                          title={m.fullName || m.userId}
                          description={m.roleInGroup}
                        />
                      </List.Item>
                    )}
                  />

                  <h3 style={{ marginTop: 16 }}>Vehicles</h3>
                  <List
                    loading={vehiclesLoading}
                    itemLayout="horizontal"
                    dataSource={
                      selectedVehicles && selectedVehicles.length > 0
                        ? selectedVehicles
                        : selected.vehicles || []
                    }
                    renderItem={(v) => (
                      <List.Item>
                        <List.Item.Meta
                          title={v.plateNumber || v.id}
                          description={
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr",
                                gap: 4,
                              }}
                            >
                              <div className="vehicle-line">
                                <strong>Make/Model:</strong>{" "}
                                {(v.make || "-") + " / " + (v.model || "-")}
                                {typeof v.modelYear !== "undefined" && (
                                  <span>
                                    {" "}
                                    • <strong>Year:</strong> {v.modelYear}
                                  </span>
                                )}
                              </div>
                              <div className="vehicle-line">
                                <strong>Status:</strong>{" "}
                                {(() => {
                                  const s = (v.status || "").toUpperCase();
                                  let color;
                                  if (s === "ACTIVE") color = "green";
                                  else if (s === "INACTIVE") color = "red";
                                  else if (s === "MAINTENANCE")
                                    color = "orange";
                                  const label =
                                    s === "ACTIVE"
                                      ? "Active"
                                      : s === "INACTIVE"
                                      ? "Inactive"
                                      : v.status || "-";
                                  return (
                                    <Tag color={color} className="status-tag">
                                      {label}
                                    </Tag>
                                  );
                                })()}
                                {v.color ? (
                                  <span>
                                    {" "}
                                    • <strong>Color:</strong> {v.color}
                                  </span>
                                ) : null}
                              </div>
                              <div className="vehicle-line">
                                <strong>Battery:</strong>{" "}
                                {v.batteryCapacityKwh ?? "-"} kWh •{" "}
                                <strong>Range:</strong> {v.rangeKm ?? "-"} km
                              </div>
                              <div className="vehicle-line">
                                <strong>Device ID:</strong>{" "}
                                {v.telematicsDeviceId || "-"}
                                {v.groupId ? (
                                  <span>
                                    {" "}
                                    • <strong>Group ID:</strong> {v.groupId}
                                  </span>
                                ) : null}
                              </div>
                              <div
                                className="vehicle-line"
                                style={{ opacity: 0.9 }}
                              >
                                <strong>Vehicle ID:</strong> {v.id || "-"}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ) : (
                <div>No data</div>
              )}
            </Modal>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
}
