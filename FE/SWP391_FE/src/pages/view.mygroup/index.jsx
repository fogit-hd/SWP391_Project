import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  List,
  Tag,
  Typography,
  Button,
  Empty,
  Space,
  Spin,
  message,
  Modal,
  Popconfirm,
  Avatar,
  Input,
  Divider,
  Tooltip,
  Tabs,
} from "antd";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlusOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import "./myGroup.css";

const { Title, Text } = Typography;

const MyGroup = () => {
  const { isAuthenticated, isCoOwner, isAdmin, isStaff } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null); // timestamp in ms
  const [inviteCountdown, setInviteCountdown] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinValue, setJoinValue] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachVehicleId, setAttachVehicleId] = useState("");
  const [attachSubmitting, setAttachSubmitting] = useState(false);
  const [togglingVehicleIds, setTogglingVehicleIds] = useState(new Set());
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const navigate = useNavigate();

  const reloadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/CoOwnership/my-groups");
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (res.data?.data && Array.isArray(res.data.data))
        list = res.data.data;
      else list = [];

      // filter out locally hidden groups per-user
      const hiddenKey = (() => {
        const userDataStr = localStorage.getItem("userData");
        try {
          const ud = userDataStr ? JSON.parse(userDataStr) : null;
          const uid = ud?.data?.id || ud?.id || null;
          return uid ? `hidden_groups_${uid}` : "hidden_groups";
        } catch {
          return "hidden_groups";
        }
      })();
      const hiddenIds = (() => {
        try {
          const raw = localStorage.getItem(hiddenKey);
          const arr = raw ? JSON.parse(raw) : [];
          return Array.isArray(arr) ? new Set(arr) : new Set();
        } catch {
          return new Set();
        }
      })();
      list = list.filter((g) => !hiddenIds.has(g.id));

      // helpers for API-driven flags
      // Determine if group has any contract (treat as Active when there is
      // at least one contract in any of these states: DRAFT/APPROVED/SIGNING).
      // Strategy: try without status first (if backend supports it). If that
      // returns nothing, fall back to querying by a whitelist of statuses.
      const fetchHasContract = async (groupId) => {
        const normalize = (r) =>
          Array.isArray(r?.data)
            ? r.data
            : Array.isArray(r?.data?.data)
            ? r.data.data
            : [];
        try {
          // 1) Try without status filter (may return all contracts)
          const rAll = await api.get("/contracts", { params: { groupId } });
          const all = normalize(rAll);
          if (Array.isArray(all) && all.length > 0) return true;
        } catch {
          // ignore and try per-status fallbacks
        }
        // 2) Try explicit statuses that should count as "has contract"
        const statuses = [
          "DRAFT",
          "APPROVED",
          "APPROVE", // some backends use APPROVE
          "SIGNING",
          "PENDING_REVIEW", // safety: often used between DRAFT and APPROVED
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
          return null;
        }
      };
      const fetchSingleOwnerOnly = async (groupId) => {
        try {
          const r = await api.get(
            `/GroupMember/get-all-members-in-group/${groupId}`
          );
          const payload = r.data?.data ?? r.data;
          const arr = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.items)
            ? payload.items
            : [];
          const owner = arr.find(
            (m) => m.roleInGroup === "OWNER" || m.role === "OWNER"
          );
          const singleOwnerOnly = arr.length === 1 && !!owner;
          const ownerUserId =
            owner?.userId || owner?.id || owner?.userID || null;
          return { singleOwnerOnly, ownerUserId };
        } catch {
          return { singleOwnerOnly: null, ownerUserId: null };
        }
      };
      const mapWithConcurrency = async (items, limit, mapper) => {
        const results = new Array(items.length);
        let i = 0;
        const workers = new Array(Math.min(limit, items.length))
          .fill(0)
          .map(async () => {
            while (i < items.length) {
              const idx = i++;
              results[idx] = await mapper(items[idx], idx);
            }
          });
        await Promise.all(workers);
        return results;
      };

      const enriched = await mapWithConcurrency(list, 5, async (g) => {
        const [hasC, ownInfo] = await Promise.all([
          fetchHasContract(g.id),
          fetchSingleOwnerOnly(g.id),
        ]);
        return {
          ...g,
          _hasContract: hasC,
          _singleOwnerOnly: ownInfo.singleOwnerOnly,
          _ownerUserId: ownInfo.ownerUserId,
        };
      });

      setGroups(enriched);
    } catch (err) {
      console.error("Failed to load my groups:", err);
      message.error("Failed to load your groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Please login to view your groups");
      navigate("/login");
      return;
    }

    if (!isCoOwner && !isAdmin && !isStaff) {
      message.error("You don't have permission to access this page");
      navigate("/");
      return;
    }

    reloadGroups();
  }, [isAuthenticated, isCoOwner, isAdmin, isStaff, navigate]);

  // Update countdown for invite code
  useEffect(() => {
    if (!inviteExpiresAt) return;
    const update = () => {
      const left = inviteExpiresAt - Date.now();
      if (left <= 0) {
        setInviteCountdown("expired");
        return;
      }
      const totalSec = Math.floor(left / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      setInviteCountdown(`${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [inviteExpiresAt]);

  const getCurrentUserId = () => {
    // Try localStorage userData first
    try {
      const userDataStr = localStorage.getItem("userData");
      if (userDataStr) {
        const ud = JSON.parse(userDataStr);
        if (ud?.data?.id) return ud.data.id;
        if (ud?.id) return ud.id;
      }
    } catch {}
    // Fallback: decode JWT
    try {
      const token = localStorage.getItem("token");
      if (token && token.includes(".")) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (
          payload?.UserId ||
          payload?.userId ||
          payload?.sub ||
          payload?.id ||
          null
        );
      }
    } catch {}
    return null;
  };

  const getOwnerIdFromGroup = (g) =>
    g?.createdById || g?.ownerId || g?.createdBy || null;

  // Check if current user is owner of a group, based on group and members list
  const isCurrentUserOwner = (group, memberList) => {
    if (!group) return false;
    const currentUserId = getCurrentUserId();
    const ownerIdFromGroup = getOwnerIdFromGroup(group);
    const ownerIdFromMembers = (memberList || []).find(
      (x) => x.roleInGroup === "OWNER"
    )?.userId;
    const myRoleFromMembers = (memberList || []).find(
      (x) => x.userId === currentUserId
    )?.roleInGroup;
    return (
      !!currentUserId &&
      (currentUserId === ownerIdFromGroup ||
        currentUserId === ownerIdFromMembers ||
        myRoleFromMembers === "OWNER")
    );
  };

  // delete locally (just hide)
  const getHiddenKey = () => {
    try {
      const ud = JSON.parse(localStorage.getItem("userData") || "null");
      const uid = ud?.data?.id || ud?.id || null;
      return uid ? `hidden_groups_${uid}` : "hidden_groups";
    } catch {
      return "hidden_groups";
    }
  };
  const getHiddenIds = () => {
    try {
      const raw = localStorage.getItem(getHiddenKey());
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };
  const setHiddenIds = (ids) => {
    try {
      localStorage.setItem(getHiddenKey(), JSON.stringify(ids || []));
    } catch {}
  };
  const hideGroup = (group) => {
    if (!group?.id) return;
    const ids = getHiddenIds();
    if (!ids.includes(group.id)) ids.push(group.id);
    setHiddenIds(ids);
    setGroups((prev) => prev.filter((x) => x.id !== group.id));
    message.success("Group hidden on this device");
  };

  const hasAnyContract = (item) => {
    if (typeof item.hasContract === "boolean") return item.hasContract;
    if (Array.isArray(item.contracts)) return item.contracts.length > 0;
    if (typeof item.contractCount === "number") return item.contractCount > 0;
    if (item.latestContract || item.contract) return true;
    return false;
  };

  const isActiveByContract = (item) =>
    item._hasContract !== null && item._hasContract !== undefined
      ? item._hasContract
      : hasAnyContract(item);

  const filteredGroups = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = groups.filter((g) =>
      q ? (g.name || "").toLowerCase().includes(q) : true
    );
    if (statusFilter === "active")
      return list.filter((g) => isActiveByContract(g));
    if (statusFilter === "inactive")
      return list.filter((g) => !isActiveByContract(g));
    return list;
  }, [groups, searchText, statusFilter]);

  const openMembers = async (group) => {
    if (!group?.id) return;
    setSelectedGroup(group);
    setMembersVisible(true);
    setInviteCode("");
    setInviteExpiresAt(null);
    await Promise.all([loadMembers(group.id), loadVehicles(group.id)]);
  };

  const openRename = (group) => {
    setRenameTarget(group);
    setRenameValue(group?.name || "");
    setRenameOpen(true);
  };

  const submitRename = async () => {
    if (!renameTarget?.id) return;
    const newName = renameValue.trim();
    if (!newName || newName === renameTarget.name) return;
    // Kiểm tra tên nhóm đã tồn tại chưa
    const exists = groups.some(
      (g) =>
        g.name?.trim().toLowerCase() === newName.toLowerCase() &&
        g.id !== renameTarget.id
    );
    if (exists) {
      message.error("Group name already exists. Please choose another name.");
      return;
    }
    setRenameSubmitting(true);
    try {
      await api.put(`/CoOwnership/${renameTarget.id}/rename`, {
        name: newName,
      });
      message.success("Group renamed");
      setRenameOpen(false);
      setRenameTarget(null);
      setRenameValue("");
      await reloadGroups();
    } catch (err) {
      console.error("Rename group failed", err);
      message.error(err?.response?.data?.message || "Rename group failed");
    } finally {
      setRenameSubmitting(false);
    }
  };

  const loadMembers = async (groupId) => {
    setMembersLoading(true);
    try {
      const res = await api.get(
        `/GroupMember/get-all-members-in-group/${groupId}`
      );
      if (Array.isArray(res.data)) setMembers(res.data);
      else if (Array.isArray(res.data?.data)) setMembers(res.data.data);
      else setMembers([]);
    } catch (err) {
      console.error("Load members failed", err);
      message.error("Failed to load members");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadVehicles = async (groupId) => {
    setVehiclesLoading(true);
    try {
      const res = await api.get(`/CoOwnership/${groupId}/vehicles`);
      let raw = [];
      if (Array.isArray(res.data)) raw = res.data;
      else if (Array.isArray(res.data?.data)) raw = res.data.data;
      else raw = [];
      // Normalize active flag from multiple possible shapes
      const normalized = (raw || []).map((v) => {
        const statusStr = (v.status || v.vehicleStatus || "").toString();
        const boolFromStatus = ["ACTIVE", "ON", "ENABLED", "TRUE"].includes(
          statusStr.toUpperCase()
        );
        const isActive =
          typeof v.isActive === "boolean"
            ? v.isActive
            : typeof v.active === "boolean"
            ? v.active
            : boolFromStatus;
        return { ...v, isActive };
      });
      setVehicles(normalized);
    } catch (err) {
      console.error("Load vehicles failed", err);
      message.error("Failed to load vehicles");
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const kickMember = async (member) => {
    if (!selectedGroup?.id || !member?.userId) return;
    try {
      await api.delete(
        `/GroupMember/deleteMember/${selectedGroup.id}/${member.userId}`
      );
      message.success("Removed member");
      await loadMembers(selectedGroup.id);
    } catch (err) {
      console.error("Remove member failed", err);
      message.error(err?.response?.data?.message || "Failed to remove member");
    }
  };

  const createInvite = async (maybeId) => {
    // onClick passes event as the first argument; ignore it and use selectedGroup
    const isClickEvent =
      typeof maybeId === "object" && (maybeId?.nativeEvent || maybeId?.target);
    const gid =
      !isClickEvent && typeof maybeId === "string"
        ? maybeId
        : selectedGroup?.id;
    if (!gid) {
      message.error("Missing group id");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await api.post(`/GroupInvite/${gid}/create-invite`, null);
      const code =
        res?.data?.inviteCode ||
        res?.data?.code ||
        res?.data?.data?.inviteCode ||
        res?.data?.data?.code ||
        "";
      if (!code) {
        message.success("Invite created");
      } else {
        setInviteCode(code);
        // Use backend expiry if provided; else 15 minutes from now
        const expiresAt =
          res?.data?.expiresAt || res?.data?.data?.expiresAt || null;
        if (expiresAt) setInviteExpiresAt(new Date(expiresAt).getTime());
        else setInviteExpiresAt(Date.now() + 15 * 60 * 1000);
        Modal.success({ title: "Invite code", content: code });
      }
    } catch (err) {
      console.error("Create invite failed", err);
      message.error(err?.response?.data?.message || "Failed to create invite");
    } finally {
      setInviteLoading(false);
    }
  };

  // Trigger invite creation from the list row, owner-only
  const handleInviteFromRow = async (group) => {
    if (!group?.id) return;
    await openMembers(group);
    await createInvite(group.id);
  };

  const copyInvite = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      message.success("Copied invite code");
    } catch {
      message.info("Invite code: " + inviteCode);
    }
  };

  // 'Delete' without backend API: hide the group locally for this user/device
  const deleteGroup = async (group) => {
    if (!group?.id) return;
    hideGroup(group);
    if (selectedGroup?.id === group.id) {
      setMembersVisible(false);
      setSelectedGroup(null);
    }
    message.success("Group hidden on this device");
  };

  const submitJoin = async () => {
    const code = (joinValue || "").trim();
    if (!code) {
      message.warning("Enter an invite code");
      return;
    }
    setJoinSubmitting(true);
    try {
      await api.post(`/GroupInvite/join-by-invite`, null, {
        params: { inviteCode: code },
      });
      message.success("Joined group successfully");
      setJoinOpen(false);
      setJoinValue("");
      await reloadGroups();
    } catch (err) {
      console.error("Join by code failed", err);
      message.error(err?.response?.data?.message || "Failed to join by code");
    } finally {
      setJoinSubmitting(false);
    }
  };

  // Vehicle actions (owner only)
  const attachVehicle = async () => {
    if (!selectedGroup?.id) return;
    const vid = (attachVehicleId || "").trim();
    if (!vid) {
      message.warning("Enter a vehicleId to attach");
      return;
    }
    setAttachSubmitting(true);
    try {
      await api.post(`/CoOwnership/attach-vehicle`, {
        groupId: selectedGroup.id,
        vehicleId: vid,
      });
      message.success("Vehicle attached to group");
      setAttachOpen(false);
      setAttachVehicleId("");
      await loadVehicles(selectedGroup.id);
    } catch (err) {
      console.error("Attach vehicle failed", err);
      const backendMsg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;
      const isDuplicate =
        status === 409 ||
        /already|attached|tồn tại|trùng|được gắn|đã thuộc|đã được/i.test(
          backendMsg
        );
      if (isDuplicate) {
        message.warning("Vehicle is already attached to another group");
      } else {
        message.error(backendMsg || "Attach vehicle failed");
      }
    } finally {
      setAttachSubmitting(false);
    }
  };

  const detachVehicle = async (vehicleId) => {
    if (!selectedGroup?.id || !vehicleId) return;
    // extra safety: prevent detach when the vehicle is active
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v && v.isActive) {
      message.warning("Please deactivate the vehicle before detaching");
      return;
    }
    try {
      await api.post(`/CoOwnership/detach-vehicle`, {
        groupId: selectedGroup.id,
        vehicleId,
      });
      message.success("Vehicle detached from group");
      await loadVehicles(selectedGroup.id);
    } catch (err) {
      console.error("Detach vehicle failed", err);
      message.error(err?.response?.data?.message || "Detach vehicle failed");
    }
  };

  const toggleVehicleStatus = async (vehicle) => {
    if (!vehicle?.id) return;
    const id = vehicle.id;
    const targetActive = !vehicle.isActive;
    // disable actions for this row
    setTogglingVehicleIds((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    try {
      if (targetActive) {
        await api.put(`/CoOwnership/vehicle/${id}/activate`);
        message.success("Vehicle activated");
      } else {
        await api.put(`/CoOwnership/vehicle/${id}/deactivate`);
        message.success("Vehicle deactivated");
      }
      // Optimistically update UI
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: targetActive } : v))
      );
      // Re-sync in background with small retry to handle eventual consistency
      const gid = selectedGroup?.id;
      if (gid) {
        const retry = async (times, delay) => {
          for (let i = 0; i < times; i++) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) =>
                setTimeout(r, i === 0 ? delay : delay * 2)
              );
              // eslint-disable-next-line no-await-in-loop
              await loadVehicles(gid);
              // After reload, verify current vehicle state matches target
              const now = (vs) => vs.find((x) => x.id === id)?.isActive;
              // eslint-disable-next-line no-loop-func
              if (now(vehicles) === targetActive) break;
            } catch {
              // continue retry
            }
          }
        };
        retry(3, 300);
      }
    } catch (err) {
      console.error("Toggle vehicle status failed", err);
      message.error(
        err?.response?.data?.message || "Failed to update vehicle status"
      );
    } finally {
      setTogglingVehicleIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // Handle back navigation based on role
  const handleBack = () => {
    if (isStaff) {
      navigate("/staff/review-econtract");
    } else if (isAdmin) {
      navigate("/admin/dashboard");
    } else if (isCoOwner) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  const EmptyState = (
    <Card>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<Text>You don't have any group</Text>}
      >
        <Link to="/create-group">
          <Button type="primary" icon={<PlusOutlined />}>
            Create group
          </Button>
        </Link>
      </Empty>
    </Card>
  );

  return (
    <>
      <div className="my-groups-page">
        <div className="my-groups-content">
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              >
                Back to homepage
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined /> My Groups
              </Title>
            </Space>
            <Space wrap>
              <Input
                placeholder="Search by group name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </Button>
              <Button onClick={() => setJoinOpen(true)}>Join by code</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/create-group")}
              >
                Create group
              </Button>
            </Space>
          </Space>

          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 40 }}
            >
              <Spin />
            </div>
          ) : groups.length === 0 ? (
            EmptyState
          ) : (
            <Card>
              <List
                className="my-groups-list"
                itemLayout="horizontal"
                dataSource={filteredGroups}
                renderItem={(item) => {
                  const activeByContract = isActiveByContract(item);
                  const currentUserId = getCurrentUserId();
                  const ownerIdFromGroup = getOwnerIdFromGroup(item);
                  const ownerIdFromMembers = item._ownerUserId;
                  const iAmOwnerRow =
                    !!currentUserId &&
                    ((ownerIdFromGroup && currentUserId === ownerIdFromGroup) ||
                      (ownerIdFromMembers &&
                        currentUserId === ownerIdFromMembers));
                  const singleOwnerOnly =
                    item._singleOwnerOnly !== null &&
                    item._singleOwnerOnly !== undefined
                      ? item._singleOwnerOnly
                      : false;
                  return (
                    <List.Item
                      actions={[
                        activeByContract ? (
                          <Tag
                            color="green"
                            icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                          >
                            Active
                          </Tag>
                        ) : (
                          <Tag
                            color="red"
                            icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}
                          >
                            Inactive
                          </Tag>
                        ),
                        <Button
                          key="members"
                          type="link"
                          onClick={() => openMembers(item)}
                        >
                          Details
                        </Button>,
                        // No delete on the row; only inside Details for owners
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <>
                            <Text type="secondary">
                              Created by: {item.createdByName || "Unknown"}
                            </Text>
                          </>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

          <Modal
            open={renameOpen}
            title={
              renameTarget ? `Rename: ${renameTarget.name}` : "Rename group"
            }
            onCancel={() => setRenameOpen(false)}
            onOk={submitRename}
            okButtonProps={{
              loading: renameSubmitting,
              disabled:
                renameSubmitting ||
                !renameValue.trim() ||
                (renameTarget && renameValue.trim() === renameTarget.name),
            }}
          >
            <Input
              autoFocus
              placeholder="Enter new group name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={100}
            />
          </Modal>

          <Modal
            title="Join a group by invite code"
            open={joinOpen}
            onCancel={() => setJoinOpen(false)}
            onOk={submitJoin}
            okText="Join"
            okButtonProps={{
              loading: joinSubmitting,
              disabled: joinSubmitting || !joinValue.trim(),
            }}
          >
            <Input
              placeholder="Enter invite code (e.g., 8A7A0D84)"
              value={joinValue}
              onChange={(e) => setJoinValue(e.target.value.toUpperCase())}
              maxLength={16}
            />
          </Modal>

          <Modal
            title={
              selectedGroup ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Group: {selectedGroup.name}</span>
                  {isCurrentUserOwner(selectedGroup, members) && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => openRename(selectedGroup)}
                    >
                      Rename
                    </Button>
                  )}
                </div>
              ) : (
                "Group details"
              )
            }
            open={membersVisible}
            onCancel={() => setMembersVisible(false)}
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div>
                  {isCurrentUserOwner(selectedGroup, members) ? (
                    <Popconfirm
                      key="delete-group-footer"
                      title="Delete this group permanently?"
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteGroup(selectedGroup)}
                    >
                      <Button danger>Delete group</Button>
                    </Popconfirm>
                  ) : null}
                </div>
                <div>
                  <Button onClick={() => setMembersVisible(false)}>
                    Close
                  </Button>
                </div>
              </div>
            }
            width={700}
          >
            {selectedGroup ? (
              <div>
                {(() => {
                  // Precompute owner permission once
                  const currentUserId = getCurrentUserId();
                  const ownerIdFromGroup = getOwnerIdFromGroup(selectedGroup);
                  const ownerIdFromMembers = members.find(
                    (x) => x.roleInGroup === "OWNER"
                  )?.userId;
                  const myRoleFromMembers = members.find(
                    (x) => x.userId === currentUserId
                  )?.roleInGroup;
                  const iAmOwner =
                    !!currentUserId &&
                    (currentUserId === ownerIdFromGroup ||
                      currentUserId === ownerIdFromMembers ||
                      myRoleFromMembers === "OWNER");
                  return (
                    <Tabs
                      defaultActiveKey="members"
                      items={[
                        {
                          key: "members",
                          label: "Members",
                          children: (
                            <>
                              {iAmOwner && (
                                <div style={{ marginBottom: 12 }}>
                                  <Space>
                                    <Button
                                      loading={inviteLoading}
                                      onClick={createInvite}
                                    >
                                      {inviteCode &&
                                      inviteCountdown !== "expired"
                                        ? "Regenerate invite code"
                                        : "Create invite code"}
                                    </Button>
                                    <Link
                                      to="/create-econtract"
                                      state={{ groupId: selectedGroup?.id }}
                                    >
                                      <Button>Create contract</Button>
                                    </Link>
                                    {inviteCode ? (
                                      <Space>
                                        <Tag color="purple">
                                          Code: {inviteCode}
                                        </Tag>
                                        <Tag>
                                          Expires in{" "}
                                          {inviteCountdown === "expired"
                                            ? "00:00"
                                            : inviteCountdown || "15:00"}
                                        </Tag>
                                        <Tooltip title="Copy to clipboard">
                                          <Button
                                            onClick={copyInvite}
                                            disabled={
                                              inviteCountdown === "expired"
                                            }
                                          >
                                            Copy
                                          </Button>
                                        </Tooltip>
                                      </Space>
                                    ) : null}
                                  </Space>
                                </div>
                              )}
                              <Divider style={{ margin: "12px 0" }} />
                              <List
                                loading={membersLoading}
                                itemLayout="horizontal"
                                dataSource={members}
                                renderItem={(m) => {
                                  const canDelete =
                                    iAmOwner && m.roleInGroup === "MEMBER";
                                  return (
                                    <List.Item
                                      actions={[
                                        <Tag
                                          key="role"
                                          color={
                                            m.roleInGroup === "OWNER"
                                              ? "gold"
                                              : "blue"
                                          }
                                        >
                                          {m.roleInGroup}
                                        </Tag>,
                                        canDelete ? (
                                          <Popconfirm
                                            key="delete"
                                            title={`Remove ${
                                              m.fullName || m.userId
                                            }?`}
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => kickMember(m)}
                                          >
                                            <Button danger type="link">
                                              Kick
                                            </Button>
                                          </Popconfirm>
                                        ) : null,
                                      ].filter(Boolean)}
                                    >
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar>
                                            {(m.fullName || m.userId || "?")
                                              .slice(0, 1)
                                              .toUpperCase()}
                                          </Avatar>
                                        }
                                        title={m.fullName || m.userId}
                                        description={
                                          m.inviteStatus ? (
                                            <span>
                                              Invite:{" "}
                                              <Tag>{m.inviteStatus}</Tag>
                                            </span>
                                          ) : null
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
                              />
                            </>
                          ),
                        },
                        {
                          key: "vehicles",
                          label: "Vehicles",
                          children: (
                            <>
                              {iAmOwner && (
                                <div style={{ marginBottom: 12 }}>
                                  <Space>
                                    <Button onClick={() => setAttachOpen(true)}>
                                      Attach vehicle
                                    </Button>
                                  </Space>
                                </div>
                              )}
                              <List
                                loading={vehiclesLoading}
                                itemLayout="horizontal"
                                rowKey={(item) => item.id}
                                dataSource={vehicles}
                                renderItem={(v) => (
                                  <List.Item
                                    actions={(() => {
                                      const disabled = togglingVehicleIds.has(
                                        v.id
                                      );
                                      return [
                                        <Tag
                                          color={v.isActive ? "green" : "red"}
                                        >
                                          {v.isActive ? "Active" : "Inactive"}
                                        </Tag>,
                                        iAmOwner ? (
                                          <Button
                                            type="link"
                                            disabled={disabled}
                                            onClick={() =>
                                              toggleVehicleStatus(v)
                                            }
                                          >
                                            {v.isActive
                                              ? "Deactivate"
                                              : "Activate"}
                                          </Button>
                                        ) : null,
                                        iAmOwner && !v.isActive ? (
                                          <Popconfirm
                                            key="detach"
                                            title="Detach this vehicle from group?"
                                            onConfirm={() =>
                                              detachVehicle(v.id)
                                            }
                                          >
                                            <Button
                                              danger
                                              type="link"
                                              disabled={disabled}
                                            >
                                              Detach
                                            </Button>
                                          </Popconfirm>
                                        ) : null,
                                      ].filter(Boolean);
                                    })()}
                                  >
                                    {(() => {
                                      const displayName =
                                        v.vehicleName ||
                                        v.name ||
                                        v.modelName ||
                                        v.model ||
                                        v.licensePlate ||
                                        "Vehicle";
                                      const avatarText = (displayName || "?")
                                        .toString()
                                        .slice(0, 1)
                                        .toUpperCase();
                                      return (
                                        <List.Item.Meta
                                          avatar={<Avatar>{avatarText}</Avatar>}
                                          title={displayName}
                                          description={
                                            v.licensePlate ? (
                                              <span>
                                                Plate: {v.licensePlate}
                                              </span>
                                            ) : null
                                          }
                                        />
                                      );
                                    })()}
                                  </List.Item>
                                )}
                              />
                            </>
                          ),
                        },
                      ]}
                    />
                  );
                })()}
              </div>
            ) : (
              <Empty description="No group selected" />
            )}
          </Modal>

          <Modal
            open={attachOpen}
            title="Attach vehicle to this group"
            onCancel={() => setAttachOpen(false)}
            onOk={attachVehicle}
            okText="Attach"
            okButtonProps={{
              loading: attachSubmitting,
              disabled: attachSubmitting || !attachVehicleId.trim(),
            }}
          >
            <Input
              placeholder="Enter vehicleId (UUID)"
              value={attachVehicleId}
              onChange={(e) => setAttachVehicleId(e.target.value)}
            />
          </Modal>
        </div>
      </div>
    </>
  );
};

export default MyGroup;
