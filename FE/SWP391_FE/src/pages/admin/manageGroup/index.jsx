import React, { useState, useEffect, useMemo } from "react";
import { TeamOutlined, FileTextOutlined } from "@ant-design/icons";
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
  Row,
  Col,
  Statistic,
} from "antd";
import api from "../../../config/axios";
import AdminSidebar from "../../../components/admin/AdminSidebar";
import "./manageGroup.css";

const { Content, Footer } = Layout;

export default function ManageGroup() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [groupStatistics, setGroupStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const filteredGroups = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    // Apply search filter only
    if (q) {
      return groups.filter((g) => (g.name || "").toLowerCase().includes(q));
    }

    return groups;
  }, [groups, searchText]);

  // Helper: normalize API fields
  const normalizeGroups = (arr) => (arr || []).map((g) => ({ ...g }));

  // Fetch Group Statistics
  const fetchGroupStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await api.get("/Statistic/group-and-statistics");
      if (response.data?.isSuccess) {
        setGroupStatistics(response.data.data);
      } else {
        console.error(
          "Failed to fetch group statistics:",
          response.data?.message
        );
      }
    } catch (err) {
      console.error("Error fetching group statistics:", err);
    } finally {
      setStatisticsLoading(false);
    }
  };

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

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/CoOwnership/all-groups");
      const payload = res.data?.data ?? res.data;
      let list = [];
      if (Array.isArray(payload)) list = payload;
      else if (Array.isArray(payload?.items)) list = payload.items;
      else list = [];

      const normalized = normalizeGroups(list);
      // Display all groups from API (no filtering)
      setGroups(normalized);
    } catch (err) {
      console.error("Failed to fetch groups", err);
      message.error("Cannot fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchGroupStatistics();
  }, []);

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
          style={{ cursor: "pointer" }}
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
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey="manage-groups"
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
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
            {/* Group Statistics Section */}
            <Card
              title="Thống Kê Nhóm"
              style={{ marginBottom: 24 }}
              loading={statisticsLoading}
            >
              <Row
                gutter={[12, 12]}
                style={{ display: "flex", flexWrap: "nowrap" }}
              >
                <Col flex="1" style={{ minWidth: 0 }}>
                  <Card size="small">
                    <Statistic
                      title="Tổng Số Nhóm"
                      value={groupStatistics?.totalGroups || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: "#1890ff", fontSize: "20px" }}
                    />
                  </Card>
                </Col>
                <Col flex="1" style={{ minWidth: 0 }}>
                  <Card size="small">
                    <Statistic
                      title="Nhóm Có Hợp Đồng"
                      value={groupStatistics?.groupsWithContract || 0}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: "#52c41a", fontSize: "20px" }}
                    />
                  </Card>
                </Col>
                <Col flex="1" style={{ minWidth: 0 }}>
                  <Card size="small">
                    <Statistic
                      title="Nhóm Không Có Hợp Đồng"
                      value={groupStatistics?.groupsWithoutContract || 0}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: "#ff4d4f", fontSize: "20px" }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card
              title={"Manage groups"}
              extra={
                <Button
                  onClick={() => {
                    fetchGroups();
                    fetchGroupStatistics();
                  }}
                >
                  Refresh
                </Button>
              }
            >
              {/* Filters */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <input
                  type="text"
                  placeholder="Search by group name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                    minWidth: 240,
                  }}
                />
                <Button
                  onClick={() => {
                    setSearchText("");
                  }}
                >
                  Clear
                </Button>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                </div>
              ) : (
                <Table
                  dataSource={filteredGroups.map((g) => ({
                    ...g,
                    key: g.id,
                  }))}
                  columns={columns}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} trong ${total} nhóm`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                />
              )}
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
