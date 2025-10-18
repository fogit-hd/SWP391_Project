// import React, { useState, useEffect } from "react";
// import {
//   Button,
//   Card,
//   Table,
//   Space,
//   Popconfirm,
//   message,
//   Spin,
//   Alert,
//   Breadcrumb,
//   Layout,
//   Menu,
//   theme,
// } from "antd";
// import {
//   EditOutlined,
//   DeleteOutlined,
//   PlusOutlined,
//   ReloadOutlined,
//   DesktopOutlined,
//   FileOutlined,
//   PieChartOutlined,
//   TeamOutlined,
//   UserOutlined,
//   UsergroupAddOutlined,
// } from "@ant-design/icons";
// import { Link } from "react-router-dom";

// const { Header, Content, Footer, Sider } = Layout;

// function getItem(label, key, icon, children) {
//   return {
//     key,
//     icon,
//     children,
//     label: children ? label : <Link to={key}>{label}</Link>,
//   };
// }

// const items = [
//   getItem("Dashboard", "/dashboard", <PieChartOutlined />),
//   getItem("User Management", "dropdown1", <UserOutlined />, [
//     getItem("Manage Accounts", "/manage-account", <UsergroupAddOutlined />),
//   ]),
//   getItem("Contract Management", "dropdown2", <UserOutlined />, [
//     getItem("Manage Contracts", "/manage-contract", <UsergroupAddOutlined />),
//   ]),
//   getItem("Service Management", "dropdown3", <UserOutlined />, [
//     getItem("Manage Services", "/manage-service", <UsergroupAddOutlined />),
//   ]),
// ];

// const ManageContract = () => {
//   return <div>ManageContract</div>;
// };
// export default ManageContract;

import React, { useState, useEffect } from "react";
import {
  PieChartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
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
  Space,
} from "antd";
import { Link } from "react-router-dom";
import api from "../../../config/axios";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./manageGroup.css";

const { Header, Content, Footer, Sider } = Layout;

const sidebarItems = [
  {
    key: "/admin/dashboard",
    icon: <PieChartOutlined />,
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "user-management",
    icon: <UserOutlined />,
    label: "User Management",
    children: [
      {
        key: "/manage-account",
        icon: <UsergroupAddOutlined />,
        label: <Link to="/manage-account">Manage Accounts</Link>,
      },
      {
        key: "/manage-group",
        icon: <TeamOutlined />,
        label: <Link to="/manage-group">Manage Group</Link>,
      },
    ],
  },
];

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

  // Helpers: normalize API fields and format dates safely
  const normalizeGroups = (arr) =>
    (arr || []).map((g) => ({
      ...g,
      createdBy: g?.createdBy ?? g?.created_by ?? g?.createdById ?? g?.createdByID ?? g?.createdby,
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
        if (Array.isArray(payload)) {
          setGroups(normalizeGroups(payload));
        } else if (Array.isArray(payload?.items)) {
          setGroups(normalizeGroups(payload.items));
        } else {
          setGroups([]);
        }
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
        const owner = members.find((m) => m.roleInGroup === "OWNER") || members[0];
        return owner?.fullName || owner?.userId || "-";
      },
    },
    {
      title: "Created By",
      dataIndex: ["createdBy"],
      key: "createdBy",
      render: (v, record) => v || record?.created_by || "-",
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
      dataIndex: "isActive",
      key: "isActive",
      render: (v) => (v ? <Tag color="green" className="status-tag">Active</Tag> : <Tag color="red" className="status-tag">Inactive</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelected(record);
              setDetailsVisible(true);
              setSelectedVehicles(record?.vehicles || []);
              fetchVehiclesForGroup(record?.id);
            }}
          >
            Details
          </Button>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelected(record);
              setDetailsVisible(true);
              setSelectedVehicles(record?.vehicles || []);
              fetchVehiclesForGroup(record?.id);
            }}
          >
            Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        collapsedWidth={80}
      >
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={["/manage-group"]} mode="inline" items={sidebarItems} />
      </Sider>

      <Layout>
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
              extra={<Button onClick={() => {
                (async () => {
                  setLoading(true);
                  try {
                    const res = await api.get("/CoOwnership/all-groups");
                    const payload = res.data?.data ?? res.data;
                    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
                    setGroups(normalizeGroups(list));
                    if (list.length > 0) setCurrent((i) => Math.min(i, list.length - 1));
                  } catch (e) {
                    message.error("Cannot fetch groups");
                  } finally {
                    setLoading(false);
                  }
                })();
              }}>Refresh</Button>}
            >
              <Tabs activeKey={viewKey} onChange={setViewKey} items={[
                {
                  key: "card",
                  label: "Card view",
                  children: (
                    loading ? (
                      <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
                    ) : groups.length === 0 ? (
                      <div>No groups</div>
                    ) : (
                      <div>
                        {(() => {
                          const g = groups[current];
                          const owner = g?.members?.find((m) => m.roleInGroup === "OWNER") || g?.members?.[0];
                          return (
                            <Card size="small" className="manage-group-card" style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <h3 style={{ margin: 0, cursor: 'pointer' }} onClick={() => { setSelected(g); setDetailsVisible(true); }}>{g?.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Tag color={g?.isActive ? 'green' : undefined}>{g?.isActive ? 'Active' : 'Inactive'}</Tag>
                                  <Button size="small" onClick={() => { setSelected(g); setDetailsVisible(true); setSelectedVehicles(g?.vehicles || []); fetchVehiclesForGroup(g?.id); }}>Details</Button>
                                </div>
                              </div>
                              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div><strong>ID:</strong> {g?.id}</div>
                                <div><strong>Owner:</strong> {owner?.fullName || owner?.userId || '-'}</div>
                                <div><strong>Created By:</strong> {g?.createdBy || g?.created_by || '-'}</div>
                                <div><strong>Members:</strong> {g?.members ? g.members.length : 0}</div>
                                <div><strong>Created At:</strong> {g?.createdAt || g?.created_at ? new Date(g.createdAt || g.created_at).toLocaleString() : '-'}</div>
                                <div><strong>Vehicles:</strong> {g?.vehicles ? g.vehicles.length : 0}</div>
                                <div><strong>Updated At:</strong> {g?.updatedAt || g?.updated_at ? new Date(g.updatedAt || g.updated_at).toLocaleString() : '-'}</div>
                              </div>
                            </Card>
                          );
                        })()}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                          <Button icon={<LeftOutlined />} onClick={() => setCurrent((i) => (i === 0 ? groups.length - 1 : i - 1))} />
                          <span>Group {current + 1} of {groups.length}</span>
                          <Button icon={<RightOutlined />} onClick={() => setCurrent((i) => (i + 1) % groups.length)} />
                        </div>
                      </div>
                    )
                  ),
                },
                {
                  key: "table",
                  label: "Table view",
                  children: (
                    loading ? (
                      <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
                    ) : (
                      <Table
                        dataSource={groups.map((g) => ({ ...g, key: g.id }))}
                        columns={columns}
                        pagination={{ pageSize: 10 }}
                      />
                    )
                  ),
                },
              ]} />
            </Card>

            <Modal
              title={selected ? selected.name : "Group details"}
              open={detailsVisible}
              onCancel={() => setDetailsVisible(false)}
              footer={<Button onClick={() => setDetailsVisible(false)}>Close</Button>}
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
                          avatar={<Avatar>{(m.fullName || "?").slice(0, 1)}</Avatar>}
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
                    dataSource={(selectedVehicles && selectedVehicles.length > 0) ? selectedVehicles : (selected.vehicles || [])}
                    renderItem={(v) => (
                      <List.Item>
                        <List.Item.Meta
                          title={v.plateNumber || v.id}
                          description={
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                              <div className="vehicle-line">
                                <strong>Make/Model:</strong> {(v.make || '-') + ' / ' + (v.model || '-')}
                                {typeof v.modelYear !== 'undefined' && (
                                  <span> • <strong>Year:</strong> {v.modelYear}</span>
                                )}
                              </div>
                              <div className="vehicle-line">
                                <strong>Status:</strong> {(() => {
                                  const s = (v.status || '').toUpperCase();
                                  let color;
                                  if (s === 'ACTIVE') color = 'green';
                                  else if (s === 'INACTIVE') color = 'red';
                                  else if (s === 'MAINTENANCE') color = 'orange';
                                  const label = s === 'ACTIVE' ? 'Active' : s === 'INACTIVE' ? 'Inactive' : (v.status || '-');
                                  return <Tag color={color} className="status-tag">{label}</Tag>;
                                })()}
                                {v.color ? <span> • <strong>Color:</strong> {v.color}</span> : null}
                              </div>
                              <div className="vehicle-line">
                                <strong>Battery:</strong> {v.batteryCapacityKwh ?? '-'} kWh • <strong>Range:</strong> {v.rangeKm ?? '-'} km
                              </div>
                              <div className="vehicle-line">
                                <strong>Device ID:</strong> {v.telematicsDeviceId || '-'}
                                {v.groupId ? <span> • <strong>Group ID:</strong> {v.groupId}</span> : null}
                              </div>
                              <div className="vehicle-line" style={{ opacity: 0.9 }}>
                                <strong>Vehicle ID:</strong> {v.id || '-'}
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
        <Footer style={{ textAlign: "center" }}>Ant Design ©{new Date().getFullYear()} Created by Ant UED</Footer>
      </Layout>
    </Layout>
  );
}
