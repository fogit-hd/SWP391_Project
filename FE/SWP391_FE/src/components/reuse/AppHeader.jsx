import React, { useState, useEffect } from "react";
import { Layout, Button, Space, Avatar, Dropdown, Typography, Modal, Card, Row, Col, Spin } from "antd";
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  CameraOutlined,
  CheckOutlined,
  CarOutlined,
  HistoryOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/accountSlice";
import { useAuth } from "../hooks/useAuth";
import api from "../../config/axios";
import "../../pages/home/home.css";

const { Header } = Layout;
const { Title, Text } = Typography;

const AppHeader = () => {
  const { isAuthenticated, isAdmin, isStaff, isCoOwner, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Load profile data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedProfileData = localStorage.getItem("profileData");
      if (savedProfileData) {
        try {
          setProfileData(JSON.parse(savedProfileData));
        } catch (error) {
          console.error("Error parsing saved profile data:", error);
        }
      }
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    localStorage.removeItem("profileData");
    setProfileData(null);
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileClick = async () => {
    setIsProfileModalVisible(true);
    if (!profileData) {
      await fetchProfile();
    }
  };

  const handleUpdateProfile = () => {
    const savedProfileData = localStorage.getItem("profileData");
    const parsedProfileData = savedProfileData ? JSON.parse(savedProfileData) : null;

    navigate("/update-profile", {
      state: {
        profileData: parsedProfileData,
        email: parsedProfileData?.email,
        phone: parsedProfileData?.phone,
        fullName: parsedProfileData?.fullName,
        address: parsedProfileData?.address,
        dateOfBirth: parsedProfileData?.dateOfBirth,
        gender: parsedProfileData?.gender,
        idNumber: parsedProfileData?.idNumber,
        placeOfBirth: parsedProfileData?.placeOfBirth,
        issueDate: parsedProfileData?.issueDate,
        expiryDate: parsedProfileData?.expiryDate,
        placeOfIssue: parsedProfileData?.placeOfIssue,
      },
    });
  };

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    try {
      const response = await api.get("/profile");
      const data = response.data.data || response.data;
      setProfileData(data);
      localStorage.setItem("profileData", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: handleProfileClick,
    },
    {
      key: "update-profile",
      icon: <SettingOutlined />,
      label: "Update Profile",
      onClick: handleUpdateProfile,
    },
    {
      key: "change-password",
      icon: <CheckOutlined />,
      label: "Change Password",
      onClick: () => navigate("/change-password"),
    },
    // Only show My Vehicle for Co-owner
    ...(isCoOwner ? [{
      key: "my-vehicle",
      icon: <CarOutlined />,
      label: "My Vehicle",
      onClick: () => navigate("/my-vehicle"),
    }] : []),
    // Only show Booking for Co-owner
    ...(isCoOwner ? [{
      key: "booking",
      icon: <CalendarOutlined />,
      label: "Vehicle Booking",
      onClick: () => navigate("/booking"),
    }] : []),
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "History",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Header className="header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title level={2} className="site-title" style={{ cursor: 'pointer' }}>
            EVCS
          </Title>
        </Link>

        <Space className="nav-menu">
          {/* Show "Available Teams" only when NOT authenticated */}
          {!isAuthenticated && (
            <Link to="/available">
              <Button type="text" className="nav-menu-button">
                Available Teams
              </Button>
            </Link>
          )}

          {/* Admin can see manage contracts */}
          {isAuthenticated && isAdmin && (
            <Link to="/admin/manage-contract">
              <Button type="text" className="nav-menu-button">
                Manage Contracts
              </Button>
            </Link>
          )}

          {/* Admin and Staff can review contracts */}
          {isAuthenticated && (isAdmin || isStaff) && (
            <Link to="/staff/review-econtract">
              <Button type="text" className="nav-menu-button">
                Review Contracts
              </Button>
            </Link>
          )}

          {/* CoOwner can see their contracts */}
          {isAuthenticated && isCoOwner && (
            <Link to="/my-contracts">
              <Button type="text" className="nav-menu-button">
                My Contract
              </Button>
            </Link>
          )}

          {/* CoOwner can see groups */}
          {isAuthenticated && isCoOwner && (
            <Link to="/view-myGroup">
              <Button type="text" className="nav-menu-button">
                My Groups
              </Button>
            </Link>
          )}

          {/* CoOwner can see vehicles */}
          {isAuthenticated && isCoOwner && (
            <Link to="/my-vehicle">
              <Button type="text" className="nav-menu-button">
                My Vehicles
              </Button>
            </Link>
          )}

          {/* Show Terms for non-authenticated users */}
          {!isAuthenticated && (
            <Link to="/terms">
              <Button type="text" className="nav-menu-button">
                Terms
              </Button>
            </Link>
          )}

          {/* Contact Us - always visible */}
          <Link to="/contact">
            <Button type="text" className="nav-menu-button">
              Contact Us
            </Button>
          </Link>
        </Space>

        <Space className="header-actions">
          {isAuthenticated ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space className="user-profile">
                <Text className="user-name">
                  {profileData?.fullName || user?.fullName || "N/A User"}
                </Text>
                <Avatar
                  src={profileData?.imageUrl}
                  size={40}
                  className="user-avatar"
                  onClick={handleProfileClick}
                  style={{ cursor: 'pointer' }}
                />
              </Space>
            </Dropdown>
          ) : (
            <Space className="auth-buttons">
              <Link to="/login">
                <Button ghost className="nav-button">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button type="primary" className="nav-button">
                  Register
                </Button>
              </Link>
            </Space>
          )}
        </Space>
      </Header>

      {/* Profile Modal */}
      <Modal
        title={null}
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        width={700}
        className="profile-modal"
      >
        {isProfileLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="profile-modal-content">
            <div className="profile-modal-header">
              <div className="profile-avatar-section">
                <Avatar
                  src={profileData?.imageUrl}
                  size={120}
                  icon={<UserOutlined />}
                  className="profile-modal-avatar"
                />
                <div className="profile-avatar-overlay">
                  <CameraOutlined />
                </div>
              </div>
              <div className="profile-header-info">
                <Title level={3}>{profileData?.fullName || "N/A"}</Title>
                <Text type="secondary">{profileData?.email || "N/A"}</Text>
              </div>
            </div>

            <Card title="Personal Information" className="profile-info-card">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Phone Number:</Text>
                    <div className="profile-value">
                      {profileData?.phoneNumber || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Gender:</Text>
                    <div className="profile-value">
                      {profileData?.gender || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Date of Birth:</Text>
                    <div className="profile-value">
                      {profileData?.dateOfBirth
                        ? new Date(profileData.dateOfBirth).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="profile-field">
                    <Text strong>Address:</Text>
                    <div className="profile-value">
                      {profileData?.address || "N/A"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="Identity Information" className="profile-info-card">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div className="profile-field">
                    <Text strong>ID Number:</Text>
                    <div className="profile-value">
                      {profileData?.identityNumber || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Issue Date:</Text>
                    <div className="profile-value">
                      {profileData?.issueDate
                        ? new Date(profileData.issueDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Expiry Date:</Text>
                    <div className="profile-value">
                      {profileData?.expiryDate
                        ? new Date(profileData.expiryDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="profile-field">
                    <Text strong>Place of Issue:</Text>
                    <div className="profile-value">
                      {profileData?.placeOfIssue || "N/A"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AppHeader;
