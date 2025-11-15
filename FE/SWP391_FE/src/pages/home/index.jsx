import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Layout,
  Avatar,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Carousel,
  Rate,
  Divider,
  Modal,
  Spin,
  Tag,
  Badge,
  Drawer,
  List,
  Empty,
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
  CarOutlined,
  LoginOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, restoreUser } from "../../components/redux/accountSlice";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useAuth } from "../../components/hooks/useAuth";
import "./home.css";
import "../../../index.css";
import CardNav from "../../components/animated/CardNav";
import FadeInSection from "../../components/animated/FadeInSection";
import CardSwap, { Card as SwapCard } from "../../components/animated/CardSwap";
import StarBorder from "../../components/animated/StarBorder";
import Orb from "../../components/animated/Orb";
import NotificationDetailPanel from "../../components/animated/NotificationDetailPanel";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Homepage = () => {
  const { isAuthenticated, isCoOwner, user } = useAuth();
  const dispatch = useDispatch();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authKey, setAuthKey] = useState(0);
  const [hasContract, setHasContract] = useState(false);
  const [isCheckingContract, setIsCheckingContract] = useState(false);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    console.log("=== Auth State Debug ===");
    console.log("user:", user);
    console.log("isAuthenticated:", isAuthenticated);
    console.log("hasContract:", hasContract);
    console.log("isCheckingContract:", isCheckingContract);
    console.log("authKey:", authKey);
    console.log("=====================");
  }, [user, isAuthenticated, hasContract, isCheckingContract, authKey]);

  useEffect(() => {
    if (profileData) {
      console.log("Profile data updated:", profileData);
    }
  }, [profileData]);

  useEffect(() => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    const userData = localStorage.getItem("userData");
    const savedProfileData = localStorage.getItem("profileData");

    console.log(
      "Component mount - Token exists:",
      !!token,
      "User exists:",
      !!user
    );

    if (token && userData && !user) {
      try {
        const parsedUserData = JSON.parse(userData);
        dispatch(restoreUser(parsedUserData));
        console.log("User data restored to Redux");
      } catch (error) {
        console.error("Error parsing saved user data:", error);
      }
    }

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

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const token = localStorage.getItem("token")?.replaceAll('"', "");
    const savedProfileData = localStorage.getItem("profileData");

    if (token && user && user.data && !profileData && !savedProfileData) {
      console.log("User is authenticated, auto-fetching profile data...");
      fetchProfileData();
    }
  }, [isInitialized, user, profileData]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      console.log("Checking user contracts...");
      checkUserContracts();
    }
  }, [isInitialized, isAuthenticated, user]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      console.log("Fetching notifications on mount/refresh...");
      const fetchNotifs = async () => {
        setIsNotifLoading(true);
        try {
          const res = await api.get("/notifications");
          const list = res?.data?.data || [];
          setNotifications(list);
        } catch (error) {
          console.error("Failed to load notifications", error);
        } finally {
          setIsNotifLoading(false);
        }
      };
      fetchNotifs();
    }
  }, [isInitialized, isAuthenticated, user]);

  // Function to check user contracts
  const checkUserContracts = async () => {
    if (!isAuthenticated) {
      setHasContract(false);
      return;
    }

    setIsCheckingContract(true);
    try {
      const response = await api.get("/contracts/my");
      console.log("Contract check response:", response.data);

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        // Check if there's at least one contract with status "APPROVED"
        const hasApprovedContract = response.data.data.some(
          (contract) => contract.status === "APPROVED"
        );
        setHasContract(hasApprovedContract);
        console.log("User has approved contracts:", hasApprovedContract);
        console.log(
          "All contracts:",
          response.data.data.map((c) => ({ id: c.id, status: c.status }))
        );
      } else {
        setHasContract(false);
      }
    } catch (error) {
      console.error("Error checking contracts:", error);
      setHasContract(false);

      // If 401, try to refresh token
      if (error.response?.status === 401) {
        try {
          await refreshToken();
          // Retry the contract check
          const retryResponse = await api.get("/contracts/my");
          if (
            retryResponse.data &&
            retryResponse.data.data &&
            Array.isArray(retryResponse.data.data)
          ) {
            const hasApprovedContract = retryResponse.data.data.some(
              (contract) => contract.status === "APPROVED"
            );
            setHasContract(hasApprovedContract);
          }
        } catch (refreshError) {
          console.error(
            "Failed to refresh token for contract check:",
            refreshError
          );
          setHasContract(false);
        }
      }
    } finally {
      setIsCheckingContract(false);
    }
  };

  // Notification helpers
  const formatRelativeTime = (iso) => {
    if (!iso) return "";
    const created = new Date(iso);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - created.getTime());
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "vừa xong";
    if (minutes < 60) return `${minutes}p trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsNotifLoading(true);
    try {
      const res = await api.get("/notifications");
      const list = res?.data?.data || [];
      setNotifications(list);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setIsNotifLoading(false);
    }
  }, [isAuthenticated]);

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications read", error);
    }
  };

  // Function to handle booking request navigation
  const handleBookingRequest = () => {
    if (!isAuthenticated) {
      toast.warning("Bạn chưa đăng nhập. Vui lòng đăng nhập trước!", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login");
      return;
    }

    if (!hasContract) {
      toast.warning(
        "Bạn cần có hợp đồng đã được duyệt để tạo yêu cầu đặt lịch!",
        { position: "top-center", autoClose: 3000 }
      );
      return;
    }

    navigate("/booking");
  };

  // Function to handle user logout
  const handleLogout = async () => {
    const refreshToken = "";

    try {
      const response = await api.post("/auth/logout", refreshToken, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error during logout API call:", error);
    }
    console.log("Đang đăng xuất người dùng...");
    dispatch(logout());
    navigate("/login");

    setProfileData(null);
    setProfileImage(null);
    setIsProfileModalVisible(false);
    setHasContract(false);
    setIsCheckingContract(false);

    setAuthKey((prev) => prev + 1);
    toast.success("Đăng xuất thành công!");

    console.log("Đã đăng xuất, ở lại trang chủ");
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

  // Helper function to check authentication before navigation
  const handleProtectedNavigation = (path) => {
    if (!isAuthenticated) {
      toast.warning("Bạn chưa đăng nhập. Vui lòng đăng nhập trước!", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login");
      return false;
    }
    navigate(path);
    return true;
  };

  const handleUpdateProfile = () => {
    if (!isAuthenticated) {
      toast.warning("Bạn chưa đăng nhập. Vui lòng đăng nhập trước!", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/login");
      return;
    }

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
        "Our family shares a fleet with two other families in our building. The kids love having different bikes to choose from, and we've built amazing friendships through this community.",
      author: "SarahNgyn L.",
      rating: 4.9,
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ của tôi",
      onClick: handleProfileClick,
    },
    {
      key: "update-profile",
      icon: <SettingOutlined />,
      label: "Cập nhật hồ sơ",
      onClick: handleUpdateProfile,
    },
    {
      key: "change-password",
      icon: <CheckOutlined />,
      label: "Đổi mật khẩu",
      onClick: () => handleProtectedNavigation("/change-password"),
    },
    // Only show My Vehicle for Co-owner
    ...(isCoOwner
      ? [
          {
            key: "my-vehicle",
            icon: <CarOutlined />,
            label: "Xe của tôi",
            onClick: () => handleProtectedNavigation("/view-myvehicle"),
          },
        ]
      : []),
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: "Lịch sử",
      onClick: () => handleProtectedNavigation("/payment-history"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  const items = [
    {
      label: "Thông tin",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        {
          key: "group",
          label: "Nhóm",
          onClick: () => handleProtectedNavigation("/view-mygroup"),
        },
        {
          key: "contract",
          label: "Hợp đồng",
          onClick: () => handleProtectedNavigation("/view-mycontract"),
        },
        {
          key: "vehicle",
          label: "Xe",
          onClick: () => handleProtectedNavigation("/view-myvehicle"),
        },
      ],
    },
    {
      label: "Dịch vụ",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        {
          key: "service-request",
          label: "Yêu cầu dịch vụ",
          onClick: () => handleProtectedNavigation("/create-service-request"),
        },
        // Only show Booking Request if user is authenticated and has contracts
        ...(isAuthenticated && hasContract
          ? [
              {
                key: "booking-request",
                label: "Đặt lịch sử dụng",
                onClick: handleBookingRequest,
              },
            ]
          : []),
      ],
    },
    {
      label: "Thông tin",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        {
          key: "FERAD",
          label: "React advances",
          onClick: () => navigate("/react-advances"),
        },
        {
          key: "email",
          label: "Email",
          onClick: () => navigate("/contact-us"),
        },
      ],
    },
    {
      label: "Demo",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        {
          key: "react-examples",
          label: "React Examples",
          onClick: () => navigate("/react-advances"),
        },
      ],
    },
  ];

  return (
    <Layout className="page-layout">
      {/* Integrated Navigation Bar */}
      <CardNav
        key={`${authKey}-${hasContract}`}
        logo="EVCS"
        logoAlt="EVCS Logo"
        items={items}
        baseColor="transparent"
        menuColor="#fff"
        buttonBgColor="#1890ff"
        buttonTextColor="#fff"
        ease="power3.out"
        user={user}
        profileData={profileData}
        userMenuItems={userMenuItems}
        onProfileClick={handleProfileClick}
        isAuthenticated={isAuthenticated}
        rightExtras={
          isAuthenticated ? (
            <Badge count={unreadCount} size="small">
              <BellOutlined
                style={{ fontSize: 22, color: "#fff", cursor: "pointer" }}
                onClick={() => {
                  setIsNotifDrawerOpen(true);
                  fetchNotifications();
                }}
              />
            </Badge>
          ) : null
        }
      />

      {/* Notifications Drawer */}
      <Drawer
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 18 }}>Thông báo</span>
            <Button
              size="small"
              onClick={markAllNotificationsRead}
              disabled={!notifications.length || unreadCount === 0}
              style={{ borderRadius: 6 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        }
        placement="right"
        onClose={() => {
          setIsNotifDrawerOpen(false);
          setIsDetailOpen(false);
        }}
        open={isNotifDrawerOpen}
        width={420}
        className="notifications-drawer"
      >
        <List
          loading={isNotifLoading}
          locale={{ emptyText: <Empty description="Không có thông báo" /> }}
          dataSource={notifications}
          renderItem={(item, index) => (
            <List.Item
              className={`notification-item ${
                item.isRead ? "is-read" : "is-unread"
              }`}
              style={{
                cursor: "pointer",
                borderRadius: 10,
                marginBottom: 12,
                padding: "14px 16px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: `slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${
                  index * 0.05
                }s both`,
              }}
              onClick={() => {
                setSelectedNotification(item);
                setIsDetailOpen(true);
                if (!item.isRead) {
                  markNotificationRead(item.id);
                }
              }}
            >
              <List.Item.Meta
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: item.isRead ? 500 : 600,
                        fontSize: 14,
                        flex: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        color: "#8c8c8c",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}
                    >
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                }
                // description={
                //   !item.isRead ? (
                //     <Tag color="red" style={{ marginTop: 6, fontSize: 11, borderRadius: 4 }}>
                //       Chưa đọc
                //     </Tag>
                //   ) : null
                // }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Animated Notification Detail Panel */}
      <NotificationDetailPanel
        notification={selectedNotification}
        isOpen={isNotifDrawerOpen && isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onMarkRead={markNotificationRead}
        formatRelativeTime={formatRelativeTime}
      />

      <Content className="page-content">
        {/* Hero Section */}
        <div className="hero">
          <Orb
            orbCount={1}
            colors={["#1890ff"]}
            blur={100}
            duration={30}
            className="hero-orb-background"
          >
            <div className="hero-split-layout">
              <div className="hero-content-left">
                <Title level={1} className="hero-title">
                  Share The Future.
                </Title>
                <Paragraph className="hero-paragraph">
                  Trải nghiệm xe điện cao cấp mà không tốn toàn bộ chi phí. Tham
                  gia cộng đồng đồng sở hữu và chia sẻ lợi ích của giao thông
                  bền vững.
                </Paragraph>
                <StarBorder
                  type="primary"
                  size="large"
                  className="hero-cta"
                  onClick={() => handleProtectedNavigation("/view-mygroup")}
                  style={{ cursor: "pointer" }}
                >
                  Tham gia đồng sở hữu ngay
                </StarBorder>
              </div>

              <div className="hero-cards-right">
                <CardSwap
                  width={500}
                  height={550}
                  cardDistance={80}
                  verticalDistance={90}
                  delay={5000}
                  pauseOnHover={true}
                  skewAmount={10}
                  easing="elastic"
                >
                  <SwapCard>
                    <div className="card-badge-hero">Đáng tin cậy</div>
                    <div className="feature-icon-hero">
                      <RocketOutlined />
                    </div>
                    <Title level={2} className="feature-title-hero">
                      Tiết kiệm chi phí
                    </Title>
                    <Paragraph className="feature-text-hero">
                      Chia sẻ chi phí mua, bảo hiểm, bảo dưỡng và sạc.
                    </Paragraph>
                  </SwapCard>

                  <SwapCard>
                    <div className="card-badge-hero">Mượt mà</div>
                    <div className="feature-icon-hero">
                      <FireOutlined />
                    </div>
                    <Title level={2} className="feature-title-hero">
                      Trải nghiệm cao cấp
                    </Title>
                    <Paragraph className="feature-text-hero">
                      Tiếp cận các mẫu xe điện hàng đầu như Tesla, BMW và nhiều
                      hơn nữa.
                    </Paragraph>
                  </SwapCard>

                  <SwapCard>
                    <div className="card-badge-hero">Tùy biến</div>
                    <div className="feature-icon-hero">
                      <ThunderboltOutlined />
                    </div>
                    <Title level={2} className="feature-title-hero">
                      Linh hoạt sử dụng
                    </Title>
                    <Paragraph className="feature-text-hero">
                      Dùng khi cần, chia sẻ chi phí khi không dùng. Đặt lịch dễ
                      dàng qua ứng dụng.
                    </Paragraph>
                  </SwapCard>
                </CardSwap>
              </div>
            </div>
          </Orb>
        </div>

        {/* Testimonials Section */}
        <FadeInSection>
          <div className="testimonials-section">
            <Row justify="center" className="section-header">
              <Col>
                <Title level={1} className="section-title">
                  Được tin dùng bởi cộng đồng
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
        </FadeInSection>

        {/* Call to Action Section */}
        <FadeInSection>
          <div className="cta-section">
            <div className="cta-overlay" />
            <div className="cta-content">
              <Title level={1} className="cta-title">
                Sẵn sàng bắt đầu chia sẻ?
              </Title>
              <Paragraph className="cta-paragraph">
                Tham gia cộng đồng đồng sở hữu ngay hôm nay để bắt đầu tiết
                kiệm.
              </Paragraph>

              <StarBorder
                type="primary"
                size="large"
                className="cta-cta"
                onClick={() => handleProtectedNavigation("/view-mygroup")}
                style={{ cursor: "pointer" }}
              >
                Bắt đầu đồng sở hữu
              </StarBorder>
            </div>
          </div>
        </FadeInSection>
      </Content>

      {/* Chân trang */}
      <Footer className="site-footer">
        <Row gutter={[32, 32]} className="footer-content">
          <Col xs={24} md={12}>
            <Title level={5} className="footer-brand-title">
              EV CoShare - Đồng sở hữu xe điện
            </Title>
            <Paragraph className="footer-description">
              Chia sẻ tương lai giao thông bền vững. Tham gia cộng đồng để trải
              nghiệm xe điện cao cấp với chi phí hợp lý.
            </Paragraph>
          </Col>
          <Col xs={24} md={7}>
            <Title level={5} className="footer-section-title">
              Công ty
            </Title>
            <Space direction="vertical" size="small" className="footer-links">
              {["Cách hoạt động"].map((item) => (
                <a key={item} href="/" className="footer-link">
                  {item}
                </a>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={5}>
            <Title level={4} className="footer-section-title">
              Theo dõi chúng tôi
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
            &copy; {new Date().getFullYear()} EV CoShare. Chưa đăng kí bản quyền
            nha.
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
                    return profileData?.imageUrl;
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
                    <div className="upload-text">Đổi ảnh đại diện</div>
                  </div>
                </div>
              </label>
            </div>
            <div className="profile-modal-title-content">
              <Title level={2} className="profile-modal-name">
                {profileData?.fullName || "Hồ sơ người dùng"}
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
            Đóng
          </Button>,
        ]}
        width={700}
        centered
      >
        {isProfileLoading ? (
          <div className="profile-loading-container">
            <Spin size="large" />
            <div className="profile-loading-text">
              Đang tải dữ liệu hồ sơ...
            </div>
          </div>
        ) : (
          <div className="profile-content">
            {/* Personal Information Section */}
            <Card
              title="Thông tin cá nhân"
              className="profile-section-card profile-section-spacing"
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Số điện thoại:</Text>
                    <div className="profile-value">
                      {profileData?.phone || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Giới tính:</Text>
                    <div className="profile-value">
                      {profileData?.gender !== undefined ? (
                        <Tag color={profileData.gender ? "blue" : "pink"}>
                          {profileData.gender ? "Nam" : "Nữ"}
                        </Tag>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="profile-field">
                    <Text strong>Ngày sinh:</Text>
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
              title="Thông tin định danh"
              className="profile-section-card profile-section-spacing"
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Số CMND/CCCD:</Text>
                    <div className="profile-value">
                      {profileData?.idNumber || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Nơi sinh:</Text>
                    <div className="profile-value">
                      {profileData?.placeOfBirth || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="profile-field">
                    <Text strong>Địa chỉ:</Text>
                    <div className="profile-value">
                      {profileData?.address || "N/A"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Document Information Section */}
            <Card
              title="Thông tin giấy tờ"
              className="profile-section-card"
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="profile-field">
                    <Text strong>Ngày cấp:</Text>
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
                    <Text strong>Ngày hết hạn:</Text>
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
                    <Text strong>Nơi cấp:</Text>
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
