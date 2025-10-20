import React, { useEffect, useState } from "react";
import { Card, List, Tag, Typography, Button, Empty, Space, Spin, message, Modal, Popconfirm, Avatar, Input, Divider, Tooltip } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import api from "../../config/axios";

const { Title, Text } = Typography;

const MyGroup = () => {
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(false);
	const [membersVisible, setMembersVisible] = useState(false);
	const [membersLoading, setMembersLoading] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [members, setMembers] = useState([]);
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
	const navigate = useNavigate();

	const reloadGroups = async () => {
		setLoading(true);
		try {
			const res = await api.get("/CoOwnership/my-groups");
			if (Array.isArray(res.data)) {
				setGroups(res.data);
			} else if (res.data?.data && Array.isArray(res.data.data)) {
				setGroups(res.data.data);
			} else {
				setGroups([]);
			}
		} catch (err) {
			console.error("Failed to load my groups:", err);
			message.error("Failed to load your groups");
			setGroups([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		reloadGroups();
	}, []);

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
			const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
			const ss = String(totalSec % 60).padStart(2, '0');
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

			// Fallback: parse JWT access token
			try {
				const token = localStorage.getItem("token")?.replaceAll('"', "");
				if (!token) return null;
				const base64Url = token.split(".")[1];
				if (!base64Url) return null;
				const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
				const payload = JSON.parse(decodeURIComponent(atob(base64).split("").map(function(c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				}).join('')));
				// Common claims: id or sub
				return payload?.id || payload?.sub || null;
			} catch {
				return null;
			}
		};

		const getOwnerIdFromGroup = (group) => {
			if (!group) return null;
			// Try common field names just in case backend provides them
			return (
				group.createdById ||
				group.createdByUserId ||
				group.ownerId ||
				null
			);
		};

		const loadMembers = async (groupId) => {
			if (!groupId) return;
			setMembersLoading(true);
			try {
				const res = await api.get(`/GroupMember/get-all-members-in-group/${groupId}`);
				const payload = res.data?.data ?? res.data;
				const list = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
				setMembers(list);
			} catch (err) {
				console.error("Failed to load members for group", groupId, err);
				message.error("Cannot load members for this group");
				setMembers([]);
			} finally {
				setMembersLoading(false);
			}
		};

		const openMembers = async (group) => {
			setSelectedGroup(group);
			setMembersVisible(true);
			setInviteCode("");
			setInviteExpiresAt(null);
			setInviteCountdown("");
			await loadMembers(group?.id);
		};

		const openRename = (group) => {
			setRenameTarget(group);
			setRenameValue(group?.name || "");
			setRenameOpen(true);
		};

		const submitRename = async () => {
			if (!renameTarget?.id) return;
			const newName = (renameValue || "").trim();
			if (!newName) {
				message.warning("Please enter a group name");
				return;
			}
			if (newName === renameTarget.name) {
				setRenameOpen(false);
				return;
			}
			setRenameSubmitting(true);
			try {
				// PUT /CoOwnership/{groupId}/rename with body { name }
				const res = await api.put(`/CoOwnership/${renameTarget.id}/rename`, { name: newName }, {
					headers: { "Content-Type": "application/json" },
				});
				message.success("Group renamed");
				// Update local state without refetch
				setGroups((prev) => prev.map((g) => (g.id === renameTarget.id ? { ...g, name: newName } : g)));
				setRenameOpen(false);
			} catch (err) {
				console.error("Rename group failed", err);
				message.error(err?.response?.data?.message || "Rename failed");
			} finally {
				setRenameSubmitting(false);
			}
		};

		const kickMember = async (member) => {
			if (!selectedGroup?.id || !member?.userId) return;
			setMembersLoading(true);
			try {
				// Correct endpoint per API docs: DELETE /GroupMember/deleteMember/{groupId}/{memberId}
				await api.delete(`/GroupMember/deleteMember/${selectedGroup.id}/${member.userId}`);
				message.success("Member removed");
				await loadMembers(selectedGroup.id);
			} catch (err) {
				console.error("Kick member failed", err);
				message.error(err?.response?.data?.message || "Kick member failed. Please verify API endpoint.");
			} finally {
				setMembersLoading(false);
			}
		};

		const createInvite = async (groupIdParam) => {
			const gid = groupIdParam || selectedGroup?.id;
			if (!gid) return;
			setInviteLoading(true);
			try {
				const res = await api.post(`/GroupInvite/${gid}/create-invite`);
				const code = res?.data?.inviteCode || res?.data?.data?.inviteCode || "";
				if (code) {
					setInviteCode(code);
					// assume 15 minutes validity from now
					setInviteExpiresAt(Date.now() + 15 * 60 * 1000);
					// Also show a modal so users can see/copy immediately
					Modal.success({
						title: "Invite code created",
						content: (
							<Space direction="vertical" size="small">
								<Tag color="purple" style={{ fontSize: 16 }}>{code}</Tag>
								{inviteExpiresAt ? (
									<Tag>Expires in {inviteCountdown === 'expired' ? '00:00' : inviteCountdown || '15:00'}</Tag>
								) : null}
								<Space>
									<Button type="primary" onClick={async () => {
										try { await navigator.clipboard.writeText(code); message.success("Copied"); } catch { message.info("Code: " + code); }
									}}>Copy</Button>
								</Space>
							</Space>
						),
						okText: "Close",
					});
				} else {
					message.warning("Invite code not returned");
				}
			} catch (err) {
				console.error("Create invite failed", err);
				message.error(err?.response?.data?.message || "Failed to create invite code");
			} finally {
				setInviteLoading(false);
			}
		};

		// Trigger invite creation from the list row, owner-only
		const handleInviteFromRow = async (group) => {
			if (!group?.id) return;
			setSelectedGroup(group);
			setMembersVisible(true);
			setInviteCode("");
			await loadMembers(group.id);
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

		const submitJoin = async () => {
			const code = (joinValue || "").trim();
			if (!code) {
				message.warning("Enter an invite code");
				return;
			}
			setJoinSubmitting(true);
			try {
				await api.post(`/GroupInvite/join-by-invite`, null, { params: { inviteCode: code } });
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

	const EmptyState = (
		<Card>
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description={<Text>You don't have any group</Text>}
			>
				<Link to="/create.group">
					<Button type="primary" icon={<PlusOutlined />}>Create group</Button>
				</Link>
			</Empty>
		</Card>
	);

	return (
		<div style={{ padding: 24 }}>
			<Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
				<Title level={3} style={{ margin: 0 }}>
					<TeamOutlined /> My Groups
				</Title>
				<Space>
					<Button onClick={() => setJoinOpen(true)}>Join by code</Button>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/create.group")}>Create group</Button>
				</Space>
			</Space>

			{loading ? (
				<div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
					<Spin />
				</div>
			) : groups.length === 0 ? (
				EmptyState
			) : (
				<Card>
					<List
						itemLayout="horizontal"
						dataSource={groups}
						renderItem={(item) => (
							<List.Item
									actions={[
									item.isActive ? (
										<Tag color="green" icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}>Active</Tag>
									) : (
										<Tag color="red" icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}>Inactive</Tag>
												),
											<Button key="members" type="link" onClick={() => openMembers(item)}>Details</Button>,
											<Button key="rename" type="link" onClick={() => openRename(item)}>Rename</Button>,
											(() => {
												const currentUserId = getCurrentUserId();
												const ownerIdFromGroup = getOwnerIdFromGroup(item);
												const iAmOwnerRow = !!currentUserId && ownerIdFromGroup && currentUserId === ownerIdFromGroup;
												return iAmOwnerRow ? (
													<Button key="invite" type="link" onClick={() => handleInviteFromRow(item)} disabled={inviteLoading}>Create invite</Button>
												) : null;
											})(),
									]}
							>
								<List.Item.Meta
									title={item.name}
									description={<>
										<Text type="secondary">Created by: {item.createdByName || "Unknown"}</Text>
									</>}
								/>
							</List.Item>
						)}
					/>
				</Card>
			)}

					<Modal
						open={renameOpen}
						title={renameTarget ? `Rename: ${renameTarget.name}` : "Rename group"}
						onCancel={() => setRenameOpen(false)}
						onOk={submitRename}
						okButtonProps={{ loading: renameSubmitting, disabled: renameSubmitting || !renameValue.trim() || (renameTarget && renameValue.trim() === renameTarget.name) }}
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
						okButtonProps={{ loading: joinSubmitting, disabled: joinSubmitting || !joinValue.trim() }}
					>
						<Input
							placeholder="Enter invite code (e.g., 8A7A0D84)"
							value={joinValue}
							onChange={(e) => setJoinValue(e.target.value.toUpperCase())}
							maxLength={16}
						/>
					</Modal>
					<Modal
						title={selectedGroup ? `Group: ${selectedGroup.name}` : "Group members"}
						open={membersVisible}
						onCancel={() => setMembersVisible(false)}
						footer={<Button onClick={() => setMembersVisible(false)}>Close</Button>}
						width={700}
					>
						{selectedGroup ? (
							<div>
								{(() => {
									// Precompute owner permission once
									const currentUserId = getCurrentUserId();
									const ownerIdFromGroup = getOwnerIdFromGroup(selectedGroup);
									const ownerIdFromMembers = members.find((x) => x.roleInGroup === "OWNER")?.userId;
									const myRoleFromMembers = members.find((x) => x.userId === currentUserId)?.roleInGroup;
									const iAmOwner = !!currentUserId && (
										(currentUserId === ownerIdFromGroup) ||
										(currentUserId === ownerIdFromMembers) ||
										(myRoleFromMembers === "OWNER")
									);
									return (
										<>
											{ iAmOwner && (
												<div style={{ marginBottom: 12 }}>
													<Space>
															<Button loading={inviteLoading} onClick={createInvite}>
																{inviteCode && inviteCountdown !== 'expired' ? 'Regenerate invite code' : 'Create invite code'}
															</Button>
															{inviteCode ? (
																<Space>
																	<Tag color="purple">Code: {inviteCode}</Tag>
																	<Tag>Expires in {inviteCountdown === 'expired' ? '00:00' : inviteCountdown || '15:00'}</Tag>
																	<Tooltip title="Copy to clipboard">
																		<Button onClick={copyInvite} disabled={inviteCountdown === 'expired'}>Copy</Button>
																	</Tooltip>
																</Space>
															) : null }
													</Space>
												</div>
											)}
											<Divider style={{ margin: "12px 0" }} />
								<List
									loading={membersLoading}
									itemLayout="horizontal"
									dataSource={members}
										renderItem={(m) => {
											const canDelete = iAmOwner && m.roleInGroup === "MEMBER";
											return (
												<List.Item
													actions={[
														<Tag key="role" color={m.roleInGroup === "OWNER" ? "gold" : "blue"}>{m.roleInGroup}</Tag>,
														canDelete ? (
															<Popconfirm
																key="delete"
																title={`Remove ${m.fullName || m.userId}?`}
																okText="Delete"
																okButtonProps={{ danger: true }}
																onConfirm={() => kickMember(m)}
															>
																<Button danger type="link">Delete</Button>
															</Popconfirm>
														) : null,
													].filter(Boolean)}
												>
													<List.Item.Meta
														avatar={<Avatar>{(m.fullName || m.userId || "?").slice(0, 1).toUpperCase()}</Avatar>}
														title={m.fullName || m.userId}
														description={m.inviteStatus ? <span>Invite: <Tag>{m.inviteStatus}</Tag></span> : null}
													/>
												</List.Item>
											);
										}}
								/>
									</>
								);
								})()}
							</div>
						) : (
							<Empty description="No group selected" />
						)}
					</Modal>
		</div>
	);
};

export default MyGroup;
