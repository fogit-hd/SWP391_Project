import React, { useEffect, useState } from "react";
import { Card, List, Tag, Typography, Button, Empty, Space, Spin, message } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import api from "../../config/axios";

const { Title, Text } = Typography;

const MyGroup = () => {
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchGroups = async () => {
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
		fetchGroups();
	}, []);

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
			<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/create.group")}>Create group</Button>
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
		</div>
	);
};

export default MyGroup;
