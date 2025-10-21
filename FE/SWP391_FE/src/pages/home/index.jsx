import React, { useState, useEffect } from "react";
import {
  Button,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Carousel,
  Rate,
  Divider,
  Modal,
  Descriptions,
  Spin,
  Tag,
} from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  FireOutlined,
  UserOutlined,
  LogoutOutlined,
  HistoryOutlined,
  SettingOutlined,
  CameraOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, restoreUser } from "../../components/redux/accountSlice";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useAuth } from "../../components/hooks/useAuth";
import "./home.css";
import "../../../index.css";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Homepage = () => {
  const { isAuthenticated, isAdmin, isStaff, isCoOwner, user } = useAuth();
  const dispatch = useDispatch();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Log profileData changes for debugging (keep for important state changes)
  useEffect(() => {
    if (profileData) {
      console.log("Profile data updated:", profileData);
    }
  }, [profileData]);

  // Initialize component and restore data from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    const userData = localStorage.getItem("userData");
    const savedProfileData = localStorage.getItem("profileData");

    // Check authentication state on component mount
    console.log(
      "Component mount - Token exists:",
      !!token,
      "User exists:",
      !!user
    );

    // Restore user data to Redux if we have token but no user in Redux
    if (token && userData && !user) {
      try {
        const parsedUserData = JSON.parse(userData);
        dispatch(restoreUser(parsedUserData));
        console.log("User data restored to Redux");
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Don't clear tokens on parse error - just log the error
      }
    }

    // Load saved profile data from localStorage
    if (savedProfileData && !profileData) {
      try {
        const parsedProfileData = JSON.parse(savedProfileData);
        setProfileData(parsedProfileData);
        console.log("Profile data loaded from localStorage");
      } catch (error) {
        console.error("Error parsing saved profile data:", error);
        localStorage.removeItem("profileData");
      }
    }

    // Mark as initialized after all restoration is done
    setIsInitialized(true);
  }, []); // Only run on mount

  // Auto-fetch profile data when user is authenticated and no profile data
  useEffect(() => {
    // Only proceed if component is initialized
    if (!isInitialized) return;

    const token = localStorage.getItem("token")?.replaceAll('"', "");
    const savedProfileData = localStorage.getItem("profileData");

    // Auto-fetch profile data when conditions are met

    // Only fetch from API if we have token, user data, and no profile data yet
    if (token && user && user.data && !profileData && !savedProfileData) {
      console.log("User is authenticated, auto-fetching profile data...");
      fetchProfileData();
    }
  }, [isInitialized, user, profileData]); // Run when initialization, user or profileData changes

  // Function to handle user logout
  const handleLogout = () => {
    console.log("refreshToken:", localStorage.getItem("refreshToken"));
    console.log("Logging out user...");

    // Clear profile data from localStorage
    localStorage.removeItem("profileData");
    setProfileData(null);
    dispatch(logout());
    navigate("/login");
  };

  // Function to handle profile menu click
  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
    console.log("User data: ", localStorage.getItem("userData"));
    // Only fetch fresh data if we don't have profile data yet
    if (!profileData) {
      console.log("No profile data found, fetching from API...");
      fetchProfileData();
    } else {
      console.log("Profile data already loaded from localStorage");
    }
  };

  const handleProfileModalClose = () => {
    setIsProfileModalVisible(false);
  };
  // Function to handle profile image change
  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Starting avatar upload...");

    setIsProfileImageLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/settings/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Profile image upload response:", response.data);

      // Check if upload was successful based on message
      if (
        response.data &&
        response.data.message &&
        response.data.message.includes("Successfully uploaded")
      ) {
        toast.success("Profile image updated successfully");

        // Fetch fresh profile data to get the new avatar
        console.log("Fetching fresh profile data after avatar upload...");
        try {
          const profileResponse = await api.get("/settings/profile");
          if (profileResponse.data && profileResponse.data.data) {
            const updatedProfileData = profileResponse.data.data;

            // Add timestamp to avatar URL to force browser refresh
            if (updatedProfileData.imageUrl) {
              updatedProfileData.imageUrl = `${
                updatedProfileData.imageUrl
              }?t=${new Date().getTime()}`;
            }
            setProfileImage(updatedProfileData.imageUrl);
            setProfileData(updatedProfileData);
            // Save updated profile data to localStorage
            localStorage.setItem(
              "profileData",
              JSON.stringify(updatedProfileData)
            );
            console.log(
              "Profile data updated with new avatar:",
              updatedProfileData
            );
          }
        } catch (profileError) {
          console.error("Error fetching updated profile data:", profileError);
        }
      } else {
        toast.error("Failed to update profile image");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);

      // If 401, try to refresh token first
      if (error.response?.status === 401) {
        try {
          console.log(
            "Token expired during avatar upload, attempting to refresh..."
          );
          await refreshToken();

          // Retry the avatar upload with new token
          console.log("Retrying avatar upload with refreshed token...");
          const retryResponse = await api.post(
            "/settings/profile/avatar",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          // Check if retry upload was successful based on message
          if (
            retryResponse.data &&
            retryResponse.data.message &&
            retryResponse.data.message.includes("Successfully uploaded")
          ) {
            toast.success("Profile image updated successfully!");

            // Fetch fresh profile data to get the new avatar
            console.log(
              "Fetching fresh profile data after retry avatar upload..."
            );
            try {
              const profileResponse = await api.get("/settings/profile");
              if (profileResponse.data && profileResponse.data.data) {
                const updatedProfileData = profileResponse.data.data;

                // Add timestamp to avatar URL to force browser refresh
                if (updatedProfileData.imageUrl) {
                  updatedProfileData.imageUrl = `${
                    updatedProfileData.imageUrl
                  }?t=${new Date().getTime()}`;
                }

                setProfileData(updatedProfileData);
                // Save updated profile data to localStorage
                localStorage.setItem(
                  "profileData",
                  JSON.stringify(updatedProfileData)
                );
              }
            } catch (profileError) {
              console.error(
                "Error fetching updated profile data after retry:",
                profileError
              );
              // If profile fetch fails after retry, don't logout - just show warning
              if (profileError.response?.status === 401) {
                console.log(
                  "Profile fetch failed after retry, but avatar upload was successful"
                );
                // Avatar was uploaded successfully, just couldn't fetch updated profile
                // This is not critical enough to logout user
              }
            }
            return;
          }
        } catch (refreshError) {
          console.error(
            "Failed to refresh token during avatar upload:",
            refreshError
          );
          console.log("Refresh token failed, redirecting to login");

          // If refresh fails, logout user
          toast.error("Authentication expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userData");
          localStorage.removeItem("profileData");
          setProfileData(null);
          setProfileImage(null);
          dispatch(logout());
          return;
        }
      }

      let errorMessage = "Failed to upload profile image. Please try again.";

      if (error.response?.status === 403) {
        errorMessage =
          "Access denied. You don't have permission to upload avatar.";
      } else if (error.response?.status === 404) {
        errorMessage = "Avatar upload endpoint not found.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message === "Network Error"
      ) {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage =
          error.response?.data?.message || error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsProfileImageLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    // Pass the parsed profileData object instead of localStorage string
    const savedProfileData = localStorage.getItem("profileData");
    const parsedProfileData = savedProfileData
      ? JSON.parse(savedProfileData)
      : null;

    navigate("/update-profile", {
      state: {
        profileData: parsedProfileData,
        // Also pass individual fields for easier access
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
  // Function to refresh token
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage
        .getItem("refreshToken")
        ?.replaceAll('"', "");
      if (!refreshTokenValue) {
        throw new Error("No refresh token found");
      }

      console.log("Attempting to refresh token...");

      const response = await api.post("/auth/refresh-token", {
        refreshToken: refreshTokenValue,
      });

      if (response.data && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Update tokens in localStorage
        localStorage.setItem("token", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        console.log("Token refreshed successfully");
        return accessToken;
      } else {
        throw new Error("Invalid refresh token response");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      console.log("Refresh token error:", error);
      console.log("Error response:", error.response);
      console.log("Error status:", error.response?.status);
      console.log("Error data:", error.response?.data);
      throw error;
    }
  };
  // Function to fetch profile data from API
  const fetchProfileData = async () => {
    setIsProfileLoading(true);
    try {
      const token = localStorage.getItem("token")?.replaceAll('"', "");
      console.log(
        "Token from localStorage:",
        token ? "Token exists" : "No token"
      );

      if (!token) {
        console.log("No token found, skipping profile fetch");
        return; // Don't show error toast on initialization
      }

      // Use the correct API endpoint
      console.log("Making API request to /settings/profile");
      const response = await api.get("/settings/profile");
      console.log("Profile data response:", response.data);
      // Extract user data from response.data.data (nested structure)
      if (response.data && response.data.data) {
        setProfileData(response.data.data);
        // Save profile data to localStorage for persistence
        localStorage.setItem("profileData", JSON.stringify(response.data.data));
        console.log("Extracted user data:", response.data.data);
      } else {
        console.error("Unexpected response structure:", response.data);
        toast.error("Unexpected response format from server");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      // If 401, try to refresh token first
      if (error.response?.status === 401) {
        try {
          console.log("Token expired, attempting to refresh...");
          await refreshToken();

          // Retry the profile request with new token
          console.log("Retrying profile request with refreshed token...");
          const retryResponse = await api.get("/settings/profile");
          console.log("Retry profile data response:", retryResponse.data);

          if (retryResponse.data && retryResponse.data.data) {
            setProfileData(retryResponse.data.data);
            // Save profile data to localStorage for persistence
            localStorage.setItem(
              "profileData",
              JSON.stringify(retryResponse.data.data)
            );
            console.log(
              "Extracted user data after retry:",
              retryResponse.data.data
            );
            toast.success("Profile data loaded successfully!");
            return;
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          // Only logout if this is a manual fetch, not auto-fetch on initialization
          if (isInitialized) {
            toast.error("Authentication expired. Please login again.");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
            localStorage.removeItem("profileData");
            setProfileData(null);
            dispatch(logout());
          }
          return;
        }
      }

      // Only show error toast if this is a manual fetch, not auto-fetch
      if (isInitialized) {
        let errorMessage = "Failed to fetch profile data. Please try again.";

        if (error.response?.status === 403) {
          errorMessage =
            "Access denied. You don't have permission to view profile.";
        } else if (error.response?.status === 404) {
          errorMessage =
            "Profile endpoint not found. Please check API configuration.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (
          error.code === "NETWORK_ERROR" ||
          error.message === "Network Error"
        ) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage =
            error.response?.data?.message || error.message || errorMessage;
        }

        toast.error(errorMessage);
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const testimonials = [
    {
      quote:
        "EV Co-ownership changed everything for me! I'm saving $200/month compared to buying my own e-bike, and I get access to premium models. The sharing schedule works perfectly with my neighbors.",
      author: "JohHuy Q.",
      rating: 5,
    },
    {
      quote:
        "As someone who only uses an e-bike on weekends, co-ownership made perfect sense. I pay a fraction of the cost and get access to top-tier adventure bikes when I need them.",
      author: "DavidVy M.",
      rating: 4.6,
    },
    {
      quote:
        "Our family shares a fleet with two other families in our building. The kids love having different bikes to choose from, and we've built amazing friendships through this community.",
      author: "SarahNgyn L.",
      rating: 4.9,
    },
  ];

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
    <Layout className="page-layout">
      <Header className="header">
        <Title level={2} className="site-title">
          EVCS
        </Title>

        <Space className="nav-menu">
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

          {/* All authenticated users can see groups */}
          {isAuthenticated && (
            <Link to="/view-mygroup">
              <Button type="text" className="nav-menu-button">
                My Groups
              </Button>
            </Link>
          )}

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
              placement="topCenter"
              arrow
            >
              <Space className="user-profile">
                <Text className="user-name">
                  {profileData?.fullName || "N/A User"}
                </Text>
                <Avatar
                  src={profileData?.imageUrl}
                  size={40}
                  className="user-avatar"
                  onClick={handleProfileClick}
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

      <Content className="page-content">
        {/* Hero Section */}
        <div className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <Title level={1} className="hero-title">
              Share the Future.
            </Title>
            <Paragraph className="hero-paragraph">
              Experience premium electric vehicles without the full cost. Join
              our co-ownership community and share the benefits of sustainable
              transportation.
            </Paragraph>
            <Link to="/view-mygroup">
              <Button type="primary" size="large" className="hero-cta">
                Join Co-Ownership Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <Row justify="center" className="section-header">
            <Col>
              <Title level={1} className="section-title">
                Why Choose Co-Ownership?
              </Title>
            </Col>
          </Row>
          <div className="features-grid">
            {[
              {
                icon: <RocketOutlined />,
                title: "Cost Savings",
                text: "Save up to 70% on electric vehicle costs by sharing ownership with like-minded individuals.",
              },
              {
                icon: <FireOutlined />,
                title: "Premium Access",
                text: "Access top-tier electric vehicles and bikes without the full purchase price.",
              },
              {
                icon: <ThunderboltOutlined />,
                title: "Flexible Usage",
                text: "Use vehicles when you need them, share costs when you don't. Perfect for occasional users.",
              },
            ].map((feature, index) => (
              <Card key={index} className="feature-card" hoverable>
                <div className="feature-icon-container">
                  <div className="feature-icon">{feature.icon}</div>
                </div>
                <Title level={3} className="feature-title">
                  {feature.title}
                </Title>
                <Paragraph className="feature-description">
                  {feature.text}
                </Paragraph>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="testimonials-section">
          <Row justify="center" className="section-header">
            <Col>
              <Title level={1} className="section-title">
                Trusted by Co-Owners
              </Title>
            </Col>
          </Row>
          <Row justify="center">
            <Col xs={24} lg={16}>
              <Carousel autoplay className="testimonials-carousel">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-item">
                    <Rate
                      disabled
                      value={testimonial.rating}
                      className="testimonial-rating"
                    />
                    <Paragraph className="testimonial-quote">
                      "{testimonial.quote}"
                    </Paragraph>
                    <Text className="testimonial-author">
                      - {testimonial.author}
                    </Text>
                  </div>
                ))}
              </Carousel>
            </Col>
          </Row>
        </div>

        {/* Call to Action Section */}
        <div className="cta-section">
          <div className="cta-overlay" />
          <div className="cta-content">
            <Title level={1} className="cta-title">
              Ready to Start Sharing?
            </Title>
            <Paragraph className="cta-paragraph">
              Join our co-ownership community today and start saving on premium
              electric vehicles.
            </Paragraph>

            <Link to="/view-mygroup">
              <Button type="primary" size="large" className="cta-cta">
                Start Co-Owning
              </Button>
            </Link>
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="site-footer">
        <Row gutter={[32, 32]} className="footer-content">
          <Col xs={24} md={10}>
            <Title level={5} className="footer-brand-title">
              EV CoShare - Electric Vehicle Co-Ownership
            </Title>
            <Paragraph className="footer-description">
              Share the future of sustainable transportation. Join our
              co-ownership community and access premium electric vehicles at a
              fraction of the cost.
            </Paragraph>
          </Col>
          <Col xs={24} md={7}>
            <Title level={4} className="footer-section-title">
              Company
            </Title>
            <Space direction="vertical" size="small" className="footer-links">
              {["How It Works", "Success Stories", "Partner With Us"].map(
                (item) => (
                  <a key={item} href="#" className="footer-link">
                    {item}
                  </a>
                )
              )}
            </Space>
          </Col>
          <Col xs={24} md={7}>
            <Title level={4} className="footer-section-title">
              Follow Us
            </Title>
            <Space direction="vertical" size="small" className="footer-links">
              {["Facebook"].map((item) => (
                <a
                  key={item}
                  href="https://www.facebook.com/phong.huynh.192/?locale=vi_VN"
                  className="footer-link"
                >
                  {item}
                </a>
              ))}
            </Space>
          </Col>
        </Row>
        <Divider className="footer-divider" />
        <div className="footer-copyright">
          <Text className="copyright-text">
            &copy; {new Date().getFullYear()} EV CoShare. All Rights Reserved.
          </Text>
        </div>
      </Footer>

      {/* Profile Modal */}
      <Modal
        className="profile-modal profile-modal-positioned"
        title={
          <div className="profile-modal-header">
            <div className="avatar-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="avatar-upload-input"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="avatar-upload-label">
                <Avatar
                  size={100}
                  src={(() => {
                    const avatarSrc = profileData?.imageUrl;
                    console.log("profileImage:", profileData?.imageUrl);
                    console.log(
                      "profileData?.imageUrl:",
                      profileData?.imageUrl
                    );
                    console.log("Final avatarSrc:", avatarSrc);
                    return avatarSrc;
                  })()}
                  className="profile-modal-avatar avatar-with-background"
                >
                  {isProfileImageLoading ? (
                    <Spin size="large" />
                  ) : (
                    profileData?.fullName?.charAt(0) || "U"
                  )}
                </Avatar>
                <div className="avatar-overlay">
                  <div className="avatar-upload-content">
                    <CameraOutlined className="camera-icon" />
                    <div className="upload-text">Change Avatar</div>
                  </div>
                </div>
              </label>
            </div>
            <div className="profile-modal-title-content">
              <Title level={2} className="profile-modal-name">
                {profileData?.fullName || "User Profile"}
              </Title>
              <Text type="secondary" className="profile-modal-email">
                {profileData?.email || ""}
              </Text>
            </div>
          </div>
        }
        open={isProfileModalVisible}
        onCancel={handleProfileModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleProfileModalClose}>
            Close
          </Button>,
        ]}
        width={700}
        centered
      >
        {isProfileLoading ? (
          <div className="profile-loading-container">
            <Spin size="large" />
            <div className="profile-loading-text">Loading profile data...</div>
          </div>
        ) : (
          <div className="profile-content">
            {/* Personal Information Section */}
            <Card
              title="Personal Information"
              className="profile-section-card profile-section-spacing"
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Phone:</Text>
                    <div className="profile-value">
                      {profileData?.phone || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Gender:</Text>
                    <div className="profile-value">
                      {profileData?.gender !== undefined ? (
                        <Tag color={profileData.gender ? "blue" : "pink"}>
                          {profileData.gender ? "Male" : "Female"}
                        </Tag>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
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
              </Row>
            </Card>

            {/* Identity Information Section */}
            <Card
              title="Identity Information"
              className="profile-section-card profile-section-spacing"
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>ID Number:</Text>
                    <div className="profile-value">
                      {profileData?.idNumber || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Place of Birth:</Text>
                    <div className="profile-value">
                      {profileData?.placeOfBirth || "N/A"}
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

            {/* Document Information Section */}
            <Card
              title="Document Information"
              className="profile-section-card"
              size="small"
            >
              <Row gutter={[16, 16]}>
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
    </Layout>
  );
};

export default Homepage;
