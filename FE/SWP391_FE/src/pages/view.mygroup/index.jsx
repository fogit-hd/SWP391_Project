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
  Popover,
  Row,
  Col,
  Descriptions,
  Image,
} from "antd";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlusOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../components/hooks/useAuth";
import { toast } from "react-toastify";
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
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null); // timestamp in ms
  const [inviteCountdown, setInviteCountdown] = useState("");
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // Persist invite codes per-group so re-opening details keeps the countdown
  const INVITE_STORAGE_KEY = "group_invites_v1";
  const saveInviteToStorage = (groupId, code, expiresAt) => {
    if (!groupId) return;
    try {
      const raw = localStorage.getItem(INVITE_STORAGE_KEY) || "{}";
      const map = JSON.parse(raw || "{}") || {};
      map[groupId] = { code, expiresAt };
      localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      // ignore storage errors
    }
  };
  const loadInviteFromStorage = (groupId) => {
    if (!groupId) return null;
    try {
      const raw = localStorage.getItem(INVITE_STORAGE_KEY) || "{}";
      const map = JSON.parse(raw || "{}") || {};
      return map[groupId] || null;
    } catch (e) {
      return null;
    }
  };
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinValue, setJoinValue] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachVehicleId, setAttachVehicleId] = useState("");
  const [attachSubmitting, setAttachSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [myVehicles, setMyVehicles] = useState([]);
  const [myVehiclesLoading, setMyVehiclesLoading] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [createServiceSubmitting, setCreateServiceSubmitting] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    vehicleId: "",
    serviceCenterId: "",
    type: "MAINTENANCE",
    title: "",
    description: "",
  });
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingServiceCenters, setLoadingServiceCenters] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingRequest, setConfirmingRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(true); // true = confirm, false = reject
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [myConfirmations, setMyConfirmations] = useState([]); // Danh sách confirmations của user hiện tại
  const [confirmationsLoading, setConfirmationsLoading] = useState(false);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [myInvoices, setMyInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [votingStatuses, setVotingStatuses] = useState({}); // { requestId: { data, totalMembers } }
  const [loadingVotingStatuses, setLoadingVotingStatuses] = useState({}); // { requestId: boolean }
  const [serviceRequestDetailOpen, setServiceRequestDetailOpen] =
    useState(false);
  const [serviceRequestDetail, setServiceRequestDetail] = useState(null);
  const [serviceRequestDetailLoading, setServiceRequestDetailLoading] =
    useState(false);
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("members");
  const navigate = useNavigate();
  const location = useLocation();

  const [attachedVehicleIds, setAttachedVehicleIds] = useState(new Set());
  const [checkingAttached, setCheckingAttached] = useState(false);

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
          
          "APPROVE", // some backends use APPROVE
          
           // safety: often used between DRAFT and APPROVED
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
      console.error("Không thể tải danh sách nhóm:", err);
      message.error("Không thể tải danh sách nhóm của bạn");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceRequests = async (groupId) => {
    if (!groupId) {
      console.warn("[LOAD-SERVICE-REQUESTS] Không có groupId được cung cấp");
      setServiceRequests([]);
      return;
    }

    setServiceRequestsLoading(true);
    try {
      console.log(
        "[LOAD-SERVICE-REQUESTS] Đang tải yêu cầu dịch vụ cho nhóm:",
        groupId
      );

      let raw = [];

      // Use group-specific endpoint
      try {
        const endpoint = `/service-requests/my-group/${groupId}`;
        console.log("[LOAD-SERVICE-REQUESTS] Sử dụng endpoint:", endpoint);
        const response = await api.get(endpoint);
        console.log("[LOAD-SERVICE-REQUESTS] Phản hồi:", response.data);

        if (Array.isArray(response.data)) {
          raw = response.data;
        } else if (Array.isArray(response.data?.data)) {
          raw = response.data.data;
        }

        console.log(
          "[LOAD-SERVICE-REQUESTS] Đã tải",
          raw.length,
          "yêu cầu dịch vụ"
        );
      } catch (err) {
        console.error(
          "[LOAD-SERVICE-REQUESTS] Lỗi khi tải yêu cầu dịch vụ:",
          err
        );
        console.error(
          "[LOAD-SERVICE-REQUESTS] Phản hồi lỗi:",
          err.response?.data
        );
        throw err;
      }

      setServiceRequests(raw);

      if (raw.length > 0) {
        console.log(
          "[LOAD-SERVICE-REQUESTS] Đã tải yêu cầu dịch vụ thành công"
        );
      }
    } catch (error) {
      console.error(
        "[LOAD-SERVICE-REQUESTS] Không thể tải yêu cầu dịch vụ: ",
        error
      );
      toast.error("Không thể tải yêu cầu dịch vụ");
      setServiceRequests([]);
    } finally {
      setServiceRequestsLoading(false);
    }
  };

  const loadServiceCenters = async () => {
    setLoadingServiceCenters(true);
    try {
      console.log("[LOAD-SERVICE-CENTERS] Đang tải trung tâm dịch vụ...");
      const response = await api.get("/service-centers");
      let centerList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      console.log(
        "[LOAD-SERVICE-CENTERS] Đã tải",
        centerList.length,
        "trung tâm"
      );
      setServiceCenters(centerList);
    } catch (error) {
      console.error("[LOAD-SERVICE-CENTERS] Lỗi:", error);
      toast.error("Không thể tải trung tâm dịch vụ");
      setServiceCenters([]);
    } finally {
      setLoadingServiceCenters(false);
    }
  };

  const loadMyConfirmations = async () => {
    setConfirmationsLoading(true);
    try {
      console.log("[LOAD-MY-CONFIRMATIONS] Đang tải xác nhận của tôi...");
      const response = await api.get("/service-request-confirmations/my");
      let confirmationList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      console.log(
        "[LOAD-MY-CONFIRMATIONS] Đã tải",
        confirmationList.length,
        "xác nhận"
      );
      setMyConfirmations(confirmationList);
    } catch (error) {
      console.error("[LOAD-MY-CONFIRMATIONS] Lỗi:", error);
      // Don't show error toast, just log it
      setMyConfirmations([]);
    } finally {
      setConfirmationsLoading(false);
    }
  };

  // Fetch voting status for a service request
  const fetchVotingStatus = async (requestId, force = false) => {
    if (!requestId) {
      return;
    }

    // If not forcing and already loaded or loading, return
    if (
      !force &&
      (votingStatuses[requestId] || loadingVotingStatuses[requestId])
    ) {
      return; // Already loaded or loading
    }

    // If forcing, clear cache first
    if (force) {
      setVotingStatuses((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
      setLoadingVotingStatuses((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }

    setLoadingVotingStatuses((prev) => ({ ...prev, [requestId]: true }));
    try {
      const response = await api.get(
        `/service-request-confirmations/${requestId}/status`
      );
      const votingData = response.data?.data || [];
      const totalMembers = members.length; // Tổng số thành viên trong group

      console.log("[FETCH-VOTING-STATUS] ID yêu cầu:", requestId);
      console.log("[FETCH-VOTING-STATUS] Dữ liệu bỏ phiếu:", votingData);
      console.log("[FETCH-VOTING-STATUS] Tổng số thành viên:", totalMembers);
      console.log(
        "[FETCH-VOTING-STATUS] Số người đã vote:",
        votingData.filter((v) => v.decision !== "PENDING").length
      );
      console.log(
        "[FETCH-VOTING-STATUS] Người dùng đã xác nhận:",
        votingData.filter((v) => v.decision === "CONFIRM")
      );
      console.log(
        "[FETCH-VOTING-STATUS] Người dùng chưa vote:",
        votingData.filter((v) => v.decision === "PENDING")
      );

      setVotingStatuses((prev) => ({
        ...prev,
        [requestId]: {
          data: votingData,
          totalMembers,
        },
      }));
    } catch (error) {
      console.error("Không thể tải trạng thái bỏ phiếu:", error);
      setVotingStatuses((prev) => ({
        ...prev,
        [requestId]: {
          data: [],
          totalMembers: members.length,
        },
      }));
    } finally {
      setLoadingVotingStatuses((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }
  };

  // Fetch service request details
  const fetchServiceRequestDetails = async (requestId) => {
    if (!requestId) return;

    setServiceRequestDetailLoading(true);
    setServiceRequestDetailOpen(true);
    try {
      const response = await api.get(`/service-requests/${requestId}`);
      setServiceRequestDetail(response.data?.data || null);
    } catch (error) {
      console.error("Không thể tải chi tiết yêu cầu dịch vụ:", error);
      toast.error("Không thể tải chi tiết yêu cầu dịch vụ");
      setServiceRequestDetail(null);
    } finally {
      setServiceRequestDetailLoading(false);
    }
  };

  // Download report file
  const handleDownloadReport = async (reportUrl) => {
    if (!reportUrl) {
      toast.warning("Không có báo cáo để tải về");
      return;
    }

    try {
      // Extract filename from URL
      const urlParts = reportUrl.split("/");
      let filename = urlParts[urlParts.length - 1] || "report.txt";
      // Clean filename (remove query params if any)
      filename = filename.split("?")[0];

      // Try to fetch the file
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a temporary link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("Đã tải báo cáo thành công");
    } catch (error) {
      console.error("Lỗi khi tải báo cáo:", error);
      
      // Fallback: use direct download link (browser will handle it)
      try {
        const link = document.createElement("a");
        link.href = reportUrl;
        link.download = reportUrl.split("/").pop().split("?")[0] || "report.txt";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
        toast.info("Đang tải báo cáo...");
      } catch (fallbackError) {
        console.error("Lỗi fallback:", fallbackError);
        toast.error("Không thể tải báo cáo. Vui lòng thử lại hoặc mở link trực tiếp.");
      }
    }
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "-";
    }
  };

  // Format datetime to dd/mm/yyyy HH:mm
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return "-";
    }
  };

  // Check if current user has already confirmed/rejected a service request
  const hasUserDecided = (requestId) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !requestId) return false;

    return myConfirmations.some(
      (conf) =>
        (conf.requestId === requestId || conf.serviceRequestId === requestId) &&
        (conf.userId === currentUserId || conf.user_id === currentUserId)
    );
  };

  // Get user's decision for a request
  const getUserDecision = (requestId) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !requestId) return null;

    return myConfirmations.find(
      (conf) =>
        (conf.requestId === requestId || conf.serviceRequestId === requestId) &&
        (conf.userId === currentUserId || conf.user_id === currentUserId)
    );
  };

  const loadGroupExpenses = async (groupId) => {
    if (!groupId) {
      console.warn("[LOAD-GROUP-EXPENSES] Không có groupId được cung cấp");
      setGroupExpenses([]);
      return;
    }

    setExpensesLoading(true);
    try {
      console.log(
        "[LOAD-GROUP-EXPENSES] Đang tải chi phí cho nhóm:",
        groupId
      );

      const endpoint = `/group-expenses/group/${groupId}`;
      console.log("[LOAD-GROUP-EXPENSES] Sử dụng endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-GROUP-EXPENSES] Phản hồi:", response.data);

      let expenseList = [];
      if (Array.isArray(response.data)) {
        expenseList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        expenseList = response.data.data;
      }

      console.log(
        "[LOAD-GROUP-EXPENSES] Đã tải",
        expenseList.length,
        "chi phí"
      );
      setGroupExpenses(expenseList);
    } catch (err) {
      console.error("[LOAD-GROUP-EXPENSES] Lỗi:", err);
      console.error(
        "[LOAD-GROUP-EXPENSES] Phản hồi lỗi:",
        err.response?.data
      );
      toast.error("Không thể tải chi phí nhóm");
      setGroupExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadMyInvoices = async () => {
    setInvoicesLoading(true);
    try {
      console.log("[LOAD-MY-INVOICES] Đang tải hóa đơn của tôi...");

      const endpoint = "/member-invoices/my";
      console.log("[LOAD-MY-INVOICES] Sử dụng endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-MY-INVOICES] Phản hồi:", response.data);

      let invoiceList = [];
      if (Array.isArray(response.data)) {
        invoiceList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        invoiceList = response.data.data;
      }

      console.log(
        "[LOAD-MY-INVOICES] Đã tải",
        invoiceList.length,
        "hóa đơn"
      );
      setMyInvoices(invoiceList);
    } catch (err) {
      console.error("[LOAD-MY-INVOICES] Lỗi:", err);
      console.error("[LOAD-MY-INVOICES] Phản hồi lỗi:", err.response?.data);
      toast.error("Không thể tải hóa đơn");
      setMyInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadInvoiceDetail = async (invoiceId) => {
    if (!invoiceId) return;

    setInvoiceDetailLoading(true);
    try {
      console.log("[LOAD-INVOICE-DETAIL] Đang tải chi tiết hóa đơn:", invoiceId);

      const endpoint = `/member-invoices/${invoiceId}`;
      console.log("[LOAD-INVOICE-DETAIL] Sử dụng endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-INVOICE-DETAIL] Phản hồi:", response.data);

      let invoiceDetail = response.data?.data || response.data;
      setSelectedInvoice(invoiceDetail);
      setInvoiceDetailOpen(true);
    } catch (err) {
      console.error("[LOAD-INVOICE-DETAIL] Lỗi:", err);
      console.error(
        "[LOAD-INVOICE-DETAIL] Phản hồi lỗi:",
        err.response?.data
      );
      toast.error("Không thể tải chi tiết hóa đơn");
    } finally {
      setInvoiceDetailLoading(false);
    }
  };

  const handlePayment = async (invoiceId) => {
    if (!invoiceId) return;

    setPaymentLoading(true);
    try {
      // Use current origin instead of hardcoded localhost
      const baseUrl = window.location.origin;
      // Include payment parameter in return URLs so we can detect payment status
      const returnUrl = `${baseUrl}/view-mygroup?payment=success&invoiceId=${invoiceId}`;
      const cancelUrl = `${baseUrl}/view-mygroup?payment=cancelled&invoiceId=${invoiceId}`;

      console.log("[PAYMENT] ========== BẮT ĐẦU THANH TOÁN ==========");
      console.log("[PAYMENT] ID hóa đơn:", invoiceId);
      console.log("[PAYMENT] API:", `/invoice-payments/${invoiceId}`);
      console.log("[PAYMENT] URL trả về:", returnUrl);
      console.log("[PAYMENT] URL hủy:", cancelUrl);

      const response = await api.post(`/invoice-payments/${invoiceId}`, null, {
        params: {
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        },
      });

      console.log("[PAYMENT] ========== ĐÃ NHẬN PHẢN HỒI ==========");
      console.log("[PAYMENT] Phản hồi đầy đủ:", response);
      console.log("[PAYMENT] Dữ liệu phản hồi:", response.data);
      console.log("[PAYMENT] Kiểu dữ liệu phản hồi:", typeof response.data);

      // Try multiple ways to get payment URL
      const paymentUrl =
        response.data?.checkoutUrl || response.data?.data?.checkoutUrl;

      console.log("[PAYMENT] URL thanh toán đã trích xuất:", paymentUrl);

      if (paymentUrl) {
        console.log(
          "[PAYMENT] ✅ Đã tìm thấy URL thanh toán! Đang chuyển hướng đến:",
          paymentUrl
        );
        toast.success("Đang chuyển hướng đến cổng thanh toán...");

        // Small delay to show toast
        setTimeout(() => {
          console.log("[PAYMENT] 🚀 Đang chuyển hướng...");
          window.location.href = paymentUrl;
        }, 500);
      } else {
        console.warn("[PAYMENT] ⚠️ Không tìm thấy URL thanh toán trong phản hồi");
        console.log(
          "[PAYMENT] Các khóa có sẵn trong response.data:",
          Object.keys(response.data || {})
        );
        console.log(
          "[PAYMENT] Cấu trúc response.data đầy đủ:",
          JSON.stringify(response.data, null, 2)
        );
        toast.error("Không tìm thấy URL thanh toán trong phản hồi");
      }
    } catch (err) {
      console.error("[PAYMENT] ========== ĐÃ XẢY RA LỖI ==========");
      console.error("[PAYMENT] Lỗi:", err);
      console.error("[PAYMENT] Phản hồi lỗi:", err.response);
      console.error("[PAYMENT] Dữ liệu lỗi:", err.response?.data);
      toast.error(err?.response?.data?.message || "Không thể khởi tạo thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  const createServiceRequest = async () => {
    if (!selectedGroup?.id) {
      toast.warning("Chưa chọn nhóm");
      return;
    }
    if (
      !serviceForm.vehicleId ||
      !serviceForm.serviceCenterId ||
      !serviceForm.title
    ) {
      toast.warning(
        "Vui lòng điền đầy đủ các trường bắt buộc (Xe, Trung tâm dịch vụ & Tiêu đề)"
      );
      return;
    }

    setCreateServiceSubmitting(true);
    console.log("[CREATE-SERVICE-REQUEST] Bắt đầu tạo với dữ liệu:", {
      groupId: selectedGroup.id,
      vehicleId: serviceForm.vehicleId,
      serviceCenterId: serviceForm.serviceCenterId,
      type: serviceForm.type,
      title: serviceForm.title,
    });

    try {
      const formData = new FormData();
      formData.append("GroupId", selectedGroup.id);
      formData.append("VehicleId", serviceForm.vehicleId);
      formData.append("ServiceCenterId", serviceForm.serviceCenterId);
      formData.append("Type", serviceForm.type);
      formData.append("Title", serviceForm.title);
      if (serviceForm.description) {
        formData.append("Description", serviceForm.description);
      }

      const response = await api.post("/service-requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("[CREATE-SERVICE-REQUEST] Phản hồi:", response.data);
      toast.success("Tạo yêu cầu dịch vụ thành công!");

      setCreateServiceOpen(false);
      setServiceForm({
        vehicleId: "",
        serviceCenterId: "",
        type: "MAINTENANCE",
        title: "",
        description: "",
      });

      console.log(
        "[CREATE-SERVICE-REQUEST] Đang tải lại yêu cầu dịch vụ cho nhóm:",
        selectedGroup.id
      );
      await loadServiceRequests(selectedGroup.id);
    } catch (err) {
      console.error("[CREATE-SERVICE-REQUEST] Lỗi:", err);
      console.error(
        "[CREATE-SERVICE-REQUEST] Phản hồi lỗi:",
        err.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Không thể tạo yêu cầu dịch vụ"
      );
    } finally {
      setCreateServiceSubmitting(false);
    }
  };

  const openConfirmModal = (request, isConfirm) => {
    setConfirmingRequest(request);
    setConfirmAction(isConfirm);
    setConfirmReason("");
    setConfirmModalOpen(true);
  };

  const submitConfirmation = async () => {
    if (!confirmingRequest?.id) {
      toast.warning("Chưa chọn yêu cầu dịch vụ");
      return;
    }

    // Require reason for rejection
    if (!confirmAction && !confirmReason.trim()) {
      toast.warning("Vui lòng cung cấp lý do từ chối");
      return;
    }

    setConfirmSubmitting(true);
    console.log("[CONFIRM-SERVICE-REQUEST] Đang gửi xác nhận:", {
      requestId: confirmingRequest.id,
      confirm: confirmAction,
      reason: confirmReason,
    });

    try {
      const payload = {
        requestId: confirmingRequest.id,
        confirm: confirmAction,
        reason: confirmReason.trim() || undefined,
      };

      const response = await api.post(
        "/service-request-confirmations",
        payload
      );
      console.log("[CONFIRM-SERVICE-REQUEST] Phản hồi:", response.data);

      toast.success(
        confirmAction
          ? "Xác nhận yêu cầu dịch vụ thành công!"
          : "Đã từ chối yêu cầu dịch vụ"
      );

      setConfirmModalOpen(false);
      setConfirmingRequest(null);
      setConfirmReason("");

      // Reload confirmations, members, and service requests to update the list
      await Promise.all([
        loadMyConfirmations(),
        loadMembers(selectedGroup?.id),
      ]);
      if (selectedGroup?.id) {
        await loadServiceRequests(selectedGroup.id);

        // Force reload voting status with retry mechanism to ensure API has updated
        const requestId = confirmingRequest.id;
        console.log("[VOTE] Bắt đầu cơ chế thử lại cho yêu cầu:", requestId);

        // Retry 3 times with increasing delays
        for (let i = 0; i < 3; i++) {
          await new Promise((resolve) => setTimeout(resolve, (i + 1) * 1000));
          console.log(`[VOTE] Đang tải lại trạng thái bỏ phiếu (lần thử ${i + 1}/3)`);
          await fetchVotingStatus(requestId, true);
        }
      }
    } catch (err) {
      console.error("[CONFIRM-SERVICE-REQUEST] Lỗi:", err);
      console.error(
        "[CONFIRM-SERVICE-REQUEST] Phản hồi lỗi:",
        err.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Không thể gửi xác nhận"
      );
    } finally {
      setConfirmSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để xem nhóm của bạn");
      navigate("/login");
      return;
    }

    if (!isCoOwner && !isAdmin && !isStaff) {
      message.error("Bạn không có quyền truy cập trang này");
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
        // clear saved invite for this group
        try {
          const raw = localStorage.getItem(INVITE_STORAGE_KEY) || "{}";
          const map = JSON.parse(raw || "{}") || {};
          if (selectedGroup?.id && map[selectedGroup.id]) {
            delete map[selectedGroup.id];
            localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(map));
          }
        } catch {}
        // auto-close invite modal when expired
        if (inviteModalVisible) setInviteModalVisible(false);
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

  // Handle payment return from payment gateway
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get("payment");
    const invoiceId = searchParams.get("invoiceId");

    // Also check for common payment gateway return parameters (VNPay, etc.)
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpTransactionStatus = searchParams.get("vnp_TransactionStatus");
    const vnpTxnRef = searchParams.get("vnp_TxnRef");
    
    // Determine payment status from various sources
    let finalPaymentStatus = paymentStatus;
    let finalInvoiceId = invoiceId;

    // If payment gateway returns different format, try to parse it
    if (!finalPaymentStatus && vnpResponseCode) {
      // VNPay format: "00" means success
      if (vnpResponseCode === "00" || vnpTransactionStatus === "00") {
        finalPaymentStatus = "success";
      } else {
        finalPaymentStatus = "failed";
      }
    }

    // Try to get invoiceId from different sources
    if (!finalInvoiceId && vnpTxnRef) {
      finalInvoiceId = vnpTxnRef;
    }

    // Also check if payment gateway appends invoiceId to URL path
    if (!finalInvoiceId) {
      const pathMatch = location.pathname.match(/invoiceId[=:]([^&\/]+)/);
      if (pathMatch) {
        finalInvoiceId = pathMatch[1];
      }
    }

    console.log("[PAYMENT-RETURN] ========== PHÁT HIỆN TRẢ VỀ TỪ THANH TOÁN ==========");
    console.log("[PAYMENT-RETURN] URL đầy đủ:", window.location.href);
    console.log("[PAYMENT-RETURN] Tìm kiếm vị trí:", location.search);
    console.log("[PAYMENT-RETURN] Trạng thái thanh toán:", finalPaymentStatus);
    console.log("[PAYMENT-RETURN] ID hóa đơn:", finalInvoiceId);
    console.log("[PAYMENT-RETURN] Mã phản hồi VNPay:", vnpResponseCode);
    console.log("[PAYMENT-RETURN] Nhóm đã tải:", groups.length > 0);

    if (finalPaymentStatus && finalInvoiceId) {
      // Show notification based on payment status
      if (finalPaymentStatus === "success") {
        toast.success("Thanh toán thành công!");
      } else if (finalPaymentStatus === "cancelled") {
        toast.info("Thanh toán đã bị hủy");
      } else if (finalPaymentStatus === "failed") {
        toast.error("Thanh toán thất bại. Vui lòng thử lại.");
      }

      // Handle payment return
      const handlePaymentReturn = async () => {
        try {
          console.log("[PAYMENT-RETURN] Đang tải hóa đơn...");
          // Load all invoices first to refresh the list
          await loadMyInvoices();

          console.log(
            "[PAYMENT-RETURN] Đang mở modal chi tiết hóa đơn cho:",
            finalInvoiceId
          );
          // Load invoice detail and open modal (standalone)
          await loadInvoiceDetail(finalInvoiceId);
        } catch (err) {
          console.error("[PAYMENT-RETURN] Lỗi:", err);
          toast.error("Không thể tải chi tiết hóa đơn");
        }
      };

      // Wait for groups to load if not loaded yet
      if (groups.length === 0) {
        console.log("[PAYMENT-RETURN] Nhóm chưa được tải, đang chờ...");
        reloadGroups().then(() => {
      handlePaymentReturn();
        });
      } else {
        handlePaymentReturn();
      }

      // Clean up URL after processing
      setTimeout(() => {
      navigate("/view-mygroup", { replace: true });
      }, 100);
    } else if (location.search.includes("payment") || location.search.includes("vnp_")) {
      // If we detect payment-related params but can't parse them, log for debugging
      console.warn("[PAYMENT-RETURN] Phát hiện tham số thanh toán nhưng không thể phân tích:", {
        search: location.search,
        paymentStatus: finalPaymentStatus,
        invoiceId: finalInvoiceId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname, groups.length]);

  // Auto-open group modal when navigating from create contract page
  useEffect(() => {
    const groupIdFromState = location.state?.groupId;
    const shouldOpenModal = location.state?.openGroupModal;

    if (shouldOpenModal && groupIdFromState && groups.length > 0 && !membersVisible) {
      // Find the group by ID
      const targetGroup = groups.find((g) => g.id === groupIdFromState);
      if (targetGroup) {
        // Open the modal with the target group
        openMembers(targetGroup);
        // Clear the state to prevent reopening on re-render
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length, location.state, membersVisible]);

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
    message.success("Đã ẩn nhóm trên thiết bị này");
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
    // Restore saved invite for this group if present and not expired
    const saved = loadInviteFromStorage(group.id);
    if (saved && saved.code) {
      if (saved.expiresAt && saved.expiresAt > Date.now()) {
        setInviteCode(saved.code);
        setInviteExpiresAt(saved.expiresAt);
      } else {
        // expired - clear saved
        setInviteCode("");
        setInviteExpiresAt(null);
        try {
          const raw = localStorage.getItem(INVITE_STORAGE_KEY) || "{}";
          const map = JSON.parse(raw || "{}") || {};
          delete map[group.id];
          localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(map));
        } catch {}
      }
    } else {
      setInviteCode("");
      setInviteExpiresAt(null);
    }
    setActiveTabKey("members"); // Reset to default tab
    // Load members, vehicles, confirmations first, then service requests, expenses and invoices
    await Promise.all([
      loadMembers(group.id),
      loadVehicles(group.id),
      loadMyConfirmations(),
    ]);
    await Promise.all([
      loadServiceRequests(group.id),
      loadGroupExpenses(group.id),
      loadMyInvoices(),
    ]);
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
      message.error("Tên nhóm đã tồn tại. Vui lòng chọn tên khác.");
      return;
    }
    setRenameSubmitting(true);
    try {
      await api.put(`/CoOwnership/${renameTarget.id}/rename`, {
        name: newName,
      });
      message.success("Đã đổi tên nhóm");
      setRenameOpen(false);
      setRenameTarget(null);
      setRenameValue("");
      await reloadGroups();
    } catch (err) {
      console.error("Đổi tên nhóm thất bại", err);
      message.error(err?.response?.data?.message || "Đổi tên nhóm thất bại");
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
      console.error("Không thể tải thành viên", err);
      message.error("Không thể tải thành viên");
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
      console.error("Không thể tải xe", err);
      message.error("Không thể tải xe");
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
      message.success("Đã xóa thành viên");
      await loadMembers(selectedGroup.id);
    } catch (err) {
      console.error("Xóa thành viên thất bại", err);
      message.error(err?.response?.data?.message || "Không thể xóa thành viên");
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
      message.error("Thiếu ID nhóm");
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
        message.success("Đã tạo lời mời");
      } else {
        setInviteCode(code);
        // Use backend expiry if provided.
        // Prefer to compute TTL from server times to avoid client/server clock skew:
        // If backend returns both created_at (start time) and expires_at, compute
        // ttl = expires_at - created_at, then set local expiry = Date.now() + ttl.
        // Otherwise, fall back to direct expiresAt if present, or a short client-side fallback.
        const raw = res?.data || res?.data?.data || {};
        const expiresAtRaw = raw.expiresAt || raw.expires_at || raw.expires || null;
        const createdAtRaw = raw.createdAt || raw.created_at || raw.created || null;

        let expiresAtVal = null;
        if (expiresAtRaw && createdAtRaw) {
          try {
            const expiresMs = new Date(expiresAtRaw).getTime();
            const createdMs = new Date(createdAtRaw).getTime();
            const ttl = Math.max(0, expiresMs - createdMs);
            expiresAtVal = Date.now() + ttl;
          } catch (e) {
            // if parsing fails, fall back to direct expires
            expiresAtVal = new Date(expiresAtRaw).getTime();
          }
        } else if (expiresAtRaw) {
          // backend provided absolute expiry only
          expiresAtVal = new Date(expiresAtRaw).getTime();
        } else {
          // no server expiry available — short fallback (30s) to avoid showing infinite countdown
          expiresAtVal = Date.now() + 30 * 1000;
        }
        setInviteExpiresAt(expiresAtVal);
        // Persist to storage so re-opening details retains countdown
        saveInviteToStorage(gid, code, expiresAtVal);
        // Open custom invite modal instead of simple Modal.success
        setInviteModalVisible(true);
      }
    } catch (err) {
      console.error("Tạo lời mời thất bại", err);
      message.error(err?.response?.data?.message || "Không thể tạo lời mời");
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
      message.success("Đã sao chép mã mời");
    } catch {
      message.info("Mã mời: " + inviteCode);
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
    message.success("Đã ẩn nhóm trên thiết bị này");
  };

  const submitJoin = async () => {
    const code = (joinValue || "").trim();
    if (!code) {
      message.warning("Nhập mã mời");
      return;
    }
    setJoinSubmitting(true);
    try {
      await api.post(`/GroupInvite/join-by-invite`, null, {
        params: { inviteCode: code },
      });
      alert("Tham gia nhóm thành công");
      setJoinOpen(false);
      setJoinValue("");
      await reloadGroups();
    } catch (err) {
      console.error("Join by code failed", err);
      alert(err?.response?.data?.message || "tham gia nhóm thất bại");
    } finally {
      setJoinSubmitting(false);
    }
  };

  // Load my vehicles for attach modal
  const loadAllGroupVehicles = async () => {
    if (!groups || groups.length === 0) {
      setAttachedVehicleIds(new Set());
      return;
    }
    setCheckingAttached(true);
    try {
      // Fetch vehicles for all groups to ensure we know which ones are attached
      const promises = groups.map((g) =>
        api.get(`/CoOwnership/${g.id}/vehicles`)
      );
      const results = await Promise.all(promises);
      const ids = new Set();
      results.forEach((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        list.forEach((v) => {
          if (v && v.id) ids.add(v.id);
        });
      });
      setAttachedVehicleIds(ids);
    } catch (e) {
      console.error("Failed to check attached vehicles", e);
    } finally {
      setCheckingAttached(false);
    }
  };

  const loadMyVehicles = async () => {
    setMyVehiclesLoading(true);
    try {
      console.log("[LOAD-MY-VEHICLES] Đang tải xe...");
      const res = await api.get("/Vehicle/my-vehicles");
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else list = [];
      console.log("[LOAD-MY-VEHICLES] Đã tải", list.length, "xe");
      setMyVehicles(list);
    } catch (err) {
      console.error("[LOAD-MY-VEHICLES] Lỗi:", err);
      toast.error("Không thể tải xe của bạn");
      setMyVehicles([]);
    } finally {
      setMyVehiclesLoading(false);
    }
  };

  // Vehicle actions (owner only)
  const attachVehicle = async (vehicleId) => {
    if (!selectedGroup?.id || !vehicleId) return;
    setAttachSubmitting(true);
    console.log(
      "[ATTACH-VEHICLE] Đang gắn xe:",
      vehicleId,
      "vào nhóm:",
      selectedGroup.id
    );

    try {
      const response = await api.post(`/CoOwnership/attach-vehicle`, {
        groupId: selectedGroup.id,
        vehicleId: vehicleId,
      });
      console.log("[ATTACH-VEHICLE] Thành công:", response.data);
      toast.success("Gắn xe vào nhóm thành công!");
      await Promise.all([loadVehicles(selectedGroup.id), loadMyVehicles()]);
    } catch (err) {
      console.error("[ATTACH-VEHICLE] Lỗi:", err);
      console.error("[ATTACH-VEHICLE] Phản hồi lỗi:", err.response?.data);
      const backendMsg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;
      const isDuplicate =
        status === 409 ||
        /already|attached|tồn tại|trùng|được gắn|đã thuộc|đã được/i.test(
          backendMsg
        );
      if (isDuplicate) {
        toast.warning("Xe đã được gắn vào nhóm khác");
      } else {
        toast.error(backendMsg || "Không thể gắn xe");
      }
    } finally {
      setAttachSubmitting(false);
    }
  };

  const openAttachModal = async () => {
    setAttachOpen(true);
    await Promise.all([loadMyVehicles(), loadAllGroupVehicles()]);
  };

  const detachVehicle = async (vehicleId) => {
    if (!selectedGroup?.id || !vehicleId) return;
    // extra safety: prevent detach when the vehicle is active
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v && v.isActive) {
      message.warning("Vui lòng vô hiệu hóa xe trước khi tháo gỡ");
      return;
    }
    try {
      await api.post(`/CoOwnership/detach-vehicle`, {
        groupId: selectedGroup.id,
        vehicleId,
      });
      message.success("Đã tháo gỡ xe khỏi nhóm");
      await loadVehicles(selectedGroup.id);
    } catch (err) {
      console.error("Tháo gỡ xe thất bại", err);
      message.error(err?.response?.data?.message || "Tháo gỡ xe thất bại");
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
        description={<Text>Bạn chưa có nhóm nào</Text>}
      >
        <Link to="/create-group">
          <Button type="primary" icon={<PlusOutlined />}>
            Tạo nhóm
          </Button>
        </Link>
      </Empty>
    </Card>
  );

  return (
    <>
      <div className="my-groups-page">
        <div className="my-groups-content">
          <div className="my-groups-header-card">
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                >
                  Về trang chủ
                </Button>
                <Title level={3} style={{ margin: 0 }}>
                  <TeamOutlined /> Nhóm của tôi
                </Title>
              </Space>
              <Space wrap>
                <Input
                  placeholder="Tìm kiếm theo tên nhóm"
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
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
                <Button
                  onClick={() => {
                    setSearchText("");
                    setStatusFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
                <Button onClick={() => setJoinOpen(true)}>Tham gia bằng mã</Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/create-group")}
                >
                  Tạo nhóm
                </Button>
              </Space>
            </Space>
          </div>

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
                            Đang hoạt động
                          </Tag>
                        ) : (
                          <Tag
                            color="red"
                            icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />}
                          >
                            Không hoạt động
                          </Tag>
                        ),
                        <Button
                          key="members"
                          type="link"
                          onClick={() => openMembers(item)}
                        >
                          Chi tiết
                        </Button>,
                        // No delete on the row; only inside Details for owners
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <>
                            <Text type="secondary">
                              Tạo bởi: {item.createdByName || "Không xác định"}
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
              renameTarget ? `Đổi tên: ${renameTarget.name}` : "Đổi tên nhóm"
            }
            onCancel={() => setRenameOpen(false)}
            onOk={submitRename}
            okText="Đổi tên"
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
              placeholder="Nhập tên nhóm mới"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={100}
            />
          </Modal>

          <Modal
            title="Tham gia nhóm bằng mã mời"
            open={joinOpen}
            onCancel={() => setJoinOpen(false)}
            onOk={submitJoin}
            okText="Tham gia"
            okButtonProps={{
              loading: joinSubmitting,
              disabled: joinSubmitting || !joinValue.trim(),
            }}
          >
            <Input
              placeholder="Nhập mã mời (ví dụ: 8A7A0D84)"
              value={joinValue}
              onChange={(e) => setJoinValue(e.target.value.toUpperCase())}
              maxLength={16}
            />
          </Modal>

          {/* Invite modal - professional popup for showing invite code */}
          <Modal
            title="Mã mời"
            open={inviteModalVisible}
            onCancel={() => setInviteModalVisible(false)}
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div>
                  {inviteCode ? (
                    <Button onClick={copyInvite}>Sao chép mã</Button>
                  ) : null}
                </div>
                <div>
                  <Button onClick={() => setInviteModalVisible(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 14, color: "#595959" }}>
                Chia sẻ mã này với người khác để họ tham gia nhóm.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Input
                  readOnly
                  value={inviteCode}
                  style={{ fontSize: 18, fontWeight: 600 }}
                />
                <Tag color="purple">{inviteCode}</Tag>
              </div>
              <div style={{ color: "#8c8c8c" }}>
                Hết hạn sau{" "}
                {inviteCountdown === "expired"
                  ? "00:00"
                  : inviteCountdown || "15:00"}
              </div>
              <div>
                <Button
                  type="link"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    message.success("Đã sao chép mã mời");
                  }}
                >
                  Sao chép vào clipboard
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            title={
              selectedGroup ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Nhóm: {selectedGroup.name}</span>
                  {isCurrentUserOwner(selectedGroup, members) && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => openRename(selectedGroup)}
                    >
                      Đổi tên
                    </Button>
                  )}
                </div>
              ) : (
                "Chi tiết nhóm"
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
                  {/* Show Delete only when user is owner, group has no contract and
                      the group contains only the owner (single owner only) */}
                  {selectedGroup &&
                  isCurrentUserOwner(selectedGroup, members) &&
                  selectedGroup._singleOwnerOnly &&
                  !selectedGroup._hasContract ? (
                    <Popconfirm
                      key="delete-group-footer"
                      title="Xóa nhóm này vĩnh viễn?"
                      okText="Xóa"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteGroup(selectedGroup)}
                    >
                      <Button danger>Xóa nhóm</Button>
                    </Popconfirm>
                  ) : null}
                </div>
                <div>
                  <Button onClick={() => setMembersVisible(false)}>
                    Đóng
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
                      activeKey={activeTabKey}
                      onChange={(key) => setActiveTabKey(key)}
                      items={[
                        {
                          key: "members",
                          label: "Thành viên",
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
                                        ? "Tạo lại mã mời"
                                        : "Tạo mã mời"}
                                    </Button>
                                    {!selectedGroup?._hasContract ? (
                                      <Link
                                        to="/create-econtract"
                                        state={{ groupId: selectedGroup?.id }}
                                      >
                                        <Button>Tạo hợp đồng</Button>
                                      </Link>
                                    ) : null}
                                    {inviteCode ? (
                                      <Space>
                                        <Tag color="purple">
                                          Mã: {inviteCode}
                                        </Tag>
                                        <Tag>
                                          Hết hạn sau{" "}
                                          {inviteCountdown === "expired"
                                            ? "00:00"
                                            : inviteCountdown || "15:00"}
                                        </Tag>
                                        <Tooltip title="Sao chép vào clipboard">
                                          <Button
                                            onClick={copyInvite}
                                            disabled={
                                              inviteCountdown === "expired"
                                            }
                                          >
                                            Sao chép
                                          </Button>
                                        </Tooltip>
                                      </Space>
                                    ) : null}
                                  </Space>
                                </div>
                              )}

                              {/* If the group already has a contract, show a Booking CTA */}
                              {selectedGroup?._hasContract ? (
                                <div style={{ marginBottom: 12 }}>
                                  <Space>
                                    <Link
                                      to="/booking"
                                      state={{ groupId: selectedGroup?.id }}
                                    >
                                      <Button
                                        className="booking-btn"
                                        type="primary"
                                      >
                                        Đi đến Đặt lịch
                                      </Button>
                                    </Link>
                                  </Space>
                                </div>
                              ) : null}
                              <Divider style={{ margin: "12px 0" }} />
                              <List
                                loading={membersLoading}
                                itemLayout="horizontal"
                                dataSource={members}
                                renderItem={(m) => {
                                  const canDelete =
                                    iAmOwner &&
                                    m.roleInGroup === "MEMBER" &&
                                    // Do not allow kicking members when the group already has contracts
                                    !selectedGroup?._hasContract;
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
                                            title={`Xóa ${
                                              m.fullName || m.userId
                                            }?`}
                                            okText="Xóa"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => kickMember(m)}
                                          >
                                            <Button danger type="link">
                                              Xóa
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
                                              Lời mời:{" "}
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
                          label: "Xe",
                          children: (
                            <>
                              {iAmOwner &&
                                vehicles &&
                                vehicles.length === 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    <Space>
                                      <Button onClick={openAttachModal}>
                                        Gắn xe
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
                                  <List.Item>
                                    {(() => {
                                      const displayName =
                                        v.vehicleName ||
                                        v.name ||
                                        v.modelName ||
                                        v.model ||
                                        v.licensePlate ||
                                        "Xe";
                                      const avatarText = (displayName || "?")
                                        .toString()
                                        .slice(0, 1)
                                        .toUpperCase();
                                      return (
                                        <>
                                          <List.Item.Meta
                                            className="vehicle-meta"
                                            avatar={
                                              <Avatar>{avatarText}</Avatar>
                                            }
                                            title={displayName}
                                            description={
                                              <>
                                                <div className="vehicle-info-grid">
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Biển số
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.plateNumber ||
                                                        v.licensePlate ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Hãng
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.make ||
                                                        v.brand ||
                                                        v.manufacturer ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Năm
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.modelYear ||
                                                        v.year ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Màu
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.color ||
                                                        v.colour ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Pin (kWh)
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.batteryCapacityKwh ||
                                                        v.batteryKwh ||
                                                        v.battery_capacity ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div className="vehicle-info-row">
                                                    <div className="vehicle-info-label">
                                                      Tầm hoạt động (km)
                                                    </div>
                                                    <div className="vehicle-info-val">
                                                      {v.rangeKm ||
                                                        v.range ||
                                                        v.range_km ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="vehicle-actions">
                                                  <Tag
                                                    color={
                                                      v.isActive
                                                        ? "green"
                                                        : "red"
                                                    }
                                                  >
                                                    {v.isActive
                                                      ? "Đang hoạt động"
                                                      : "Không hoạt động"}
                                                  </Tag>
                                                  {iAmOwner ? (
                                                    <>
                                                      {!v.isActive ? (
                                                        <Popconfirm
                                                          key="detach"
                                                          title="Tháo gỡ xe này khỏi nhóm?"
                                                          onConfirm={() =>
                                                            detachVehicle(v.id)
                                                          }
                                                        >
                                                          <Button
                                                            danger
                                                            type="link"
                                                          >
                                                            Tháo gỡ
                                                          </Button>
                                                        </Popconfirm>
                                                      ) : null}
                                                    </>
                                                  ) : null}
                                                </div>
                                              </>
                                            }
                                          />
                                        </>
                                      );
                                    })()}
                                  </List.Item>
                                )}
                              />
                            </>
                          ),
                        },
                        {
                          key: "serviceRequests",
                          label: "Yêu cầu dịch vụ",
                          children: (
                            <>
                              <div style={{ marginBottom: 12 }}>
                                <Button
                                  type="primary"
                                  onClick={() => {
                                    setCreateServiceOpen(true);
                                    loadServiceCenters();
                                  }}
                                >
                                  Tạo yêu cầu dịch vụ
                                </Button>
                              </div>
                              <Divider style={{ margin: "12px 0" }} />
                              <List
                                loading={serviceRequestsLoading}
                                itemLayout="horizontal"
                                dataSource={serviceRequests}
                                locale={{
                                  emptyText: "Chưa có yêu cầu dịch vụ",
                                }}
                                renderItem={(sr) => {
                                  const statusMap = {
                                    DRAFT: { color: "default", text: "Nháp" },
                                    PENDING_QUOTE: {
                                      color: "blue",
                                      text: "Chờ báo giá",
                                    },
                                    VOTING: { color: "orange", text: "Đang bỏ phiếu" },
                                    APPROVED: {
                                      color: "green",
                                      text: "Đã phê duyệt",
                                    },
                                    REJECTED: {
                                      color: "red",
                                      text: "Đã từ chối",
                                    },
                                    IN_PROGRESS: {
                                      color: "blue",
                                      text: "Đang thực hiện",
                                    },
                                    COMPLETED: {
                                      color: "success",
                                      text: "Hoàn thành",
                                    },
                                  };
                                  const typeMap = {
                                    MAINTENANCE: {
                                      color: "blue",
                                      text: "Bảo dưỡng",
                                    },
                                    REPAIR: { color: "orange", text: "Sửa chữa" },
                                    INSPECTION: {
                                      color: "green",
                                      text: "Kiểm tra",
                                    },
                                    CLEANING: {
                                      color: "cyan",
                                      text: "Vệ sinh",
                                    },
                                    UPGRADE: {
                                      color: "purple",
                                      text: "Nâng cấp",
                                    },
                                  };
                                  const statusInfo = statusMap[sr.status] || {
                                    color: "default",
                                    text: sr.status,
                                  };
                                  const typeInfo = typeMap[sr.type] || {
                                    color: "default",
                                    text: sr.type,
                                  };

                                  // Check if user has already decided
                                  const alreadyDecided = hasUserDecided(sr.id);
                                  const userDecision = getUserDecision(sr.id);

                                  // Check if request is in VOTING status
                                  const isVoting =
                                    sr.status === "VOTING" ||
                                    sr.status === "voting" ||
                                    sr.status?.toUpperCase() === "VOTING";

                                  // Check if request is in REJECT status
                                  const isRejected =
                                    sr.status === "REJECTED" ||
                                    sr.status === "rejected" ||
                                    sr.status?.toUpperCase() === "REJECTED";

                                  // Render voting status tag with popover
                                  const renderVotingTag = () => {
                                    // Show popover only for VOTING or REJECTED status
                                    if (!isVoting && !isRejected) {
                                      return (
                                        <Tag
                                          key="status"
                                          color={statusInfo.color}
                                        >
                                          {statusInfo.text}
                                        </Tag>
                                      );
                                    }

                                    const votingStatus = votingStatuses[sr.id];
                                    const isLoading =
                                      loadingVotingStatuses[sr.id];
                                    const hasVotingData = !!votingStatus;
                                    const votingData = votingStatus?.data || [];
                                    const totalMembers =
                                      votingStatus?.totalMembers ||
                                      members.length;
                                    const votedCount = votingData.filter(
                                      (v) => v.decision !== "PENDING"
                                    ).length;
                                    const pendingUsers = votingData.filter(
                                      (v) => v.decision === "PENDING"
                                    );
                                    const confirmedUsers = votingData.filter(
                                      (v) => v.decision === "CONFIRM"
                                    );
                                    const rejectUsers = votingData.filter(
                                      (v) => v.decision === "REJECT"
                                    );

                                    const renderVotingContent = () => {
                                      if (isLoading) {
                                        return <Spin size="small" />;
                                      }

                                      // Nếu status là REJECT, chỉ hiển thị danh sách người đã reject
                                      if (isRejected) {
                                        return (
                                          <div style={{ maxWidth: 300 }}>
                                            {rejectUsers.length > 0 ? (
                                              <>
                                                <div
                                                  style={{
                                                    marginBottom: 8,
                                                    fontWeight: 600,
                                                    color: "#f5222d",
                                                  }}
                                                >
                                                  Đã bị từ chối bởi:
                                                </div>
                                                <div style={{ marginLeft: 8 }}>
                                                  {rejectUsers.map(
                                                    (user, idx) => (
                                                      <div
                                                        key={idx}
                                                        style={{
                                                          marginBottom: 8,
                                                        }}
                                                      >
                                                        <div>
                                                          <Text strong>
                                                            •{" "}
                                                            {user.fullName ||
                                                              user.userId}
                                                          </Text>
                                                        </div>
                                                        {user.reason && (
                                                          <div
                                                            style={{
                                                              marginLeft: 12,
                                                              color: "#999",
                                                              fontSize: 12,
                                                              marginTop: 4,
                                                            }}
                                                          >
                                                            Lý do: {user.reason}
                                                          </div>
                                                        )}
                                                        {user.decidedAt && (
                                                          <div
                                                            style={{
                                                              marginLeft: 12,
                                                              color: "#999",
                                                              fontSize: 11,
                                                              marginTop: 2,
                                                            }}
                                                          >
                                                            {new Date(
                                                              user.decidedAt
                                                            ).toLocaleString(
                                                              "vi-VN"
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </>
                                            ) : (
                                              <Text type="secondary">
                                                Chưa có dữ liệu về người từ chối
                                              </Text>
                                            )}
                                          </div>
                                        );
                                      }

                                      // Nếu status là VOTING, hiển thị thông tin vote đầy đủ
                                      return (
                                        <div style={{ maxWidth: 300 }}>
                                          <div
                                            style={{
                                              marginBottom: 8,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {votedCount} / {totalMembers} đã
                                            bỏ phiếu
                                          </div>

                                          {confirmedUsers.length > 0 && (
                                            <div style={{ marginBottom: 8 }}>
                                              <Text
                                                strong
                                                style={{ color: "#52c41a" }}
                                              >
                                                Đã bỏ phiếu:
                                              </Text>
                                              <div
                                                style={{
                                                  marginLeft: 8,
                                                  marginTop: 4,
                                                }}
                                              >
                                                {confirmedUsers.map(
                                                  (user, idx) => (
                                                    <div
                                                      key={idx}
                                                      style={{
                                                        marginBottom: 4,
                                                      }}
                                                    >
                                                      <div>
                                                        •{" "}
                                                        <Text strong>
                                                          {user.fullName ||
                                                            user.userId}
                                                        </Text>
                                                      </div>
                                                      {user.decidedAt && (
                                                        <div
                                                          style={{
                                                            marginLeft: 12,
                                                            color: "#999",
                                                            fontSize: 11,
                                                            marginTop: 2,
                                                          }}
                                                        >
                                                          {new Date(
                                                            user.decidedAt
                                                          ).toLocaleString(
                                                            "vi-VN"
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {pendingUsers.length > 0 && (
                                            <div style={{ marginBottom: 8 }}>
                                              <Text
                                                strong
                                                style={{ color: "#ff9800" }}
                                              >
                                                Chưa vote:
                                              </Text>
                                              <div
                                                style={{
                                                  marginLeft: 8,
                                                  marginTop: 4,
                                                }}
                                              >
                                                {pendingUsers.map(
                                                  (user, idx) => (
                                                    <div key={idx}>
                                                      •{" "}
                                                      {user.fullName ||
                                                        user.userId}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {rejectUsers.length > 0 && (
                                            <div>
                                              <Text
                                                strong
                                                style={{ color: "#f5222d" }}
                                              >
                                                Đã từ chối:
                                              </Text>
                                              <div
                                                style={{
                                                  marginLeft: 8,
                                                  marginTop: 4,
                                                }}
                                              >
                                                {rejectUsers.map(
                                                  (user, idx) => (
                                                    <div
                                                      key={idx}
                                                      style={{
                                                        marginBottom: 4,
                                                      }}
                                                    >
                                                      <div>
                                                        •{" "}
                                                        <Text strong>
                                                          {user.fullName ||
                                                            user.userId}
                                                        </Text>
                                                      </div>
                                                      {user.reason && (
                                                        <div
                                                          style={{
                                                            marginLeft: 12,
                                                            color: "#999",
                                                            fontSize: 12,
                                                          }}
                                                        >
                                                          Lý do: {user.reason}
                                                        </div>
                                                      )}
                                                      {user.decidedAt && (
                                                        <div
                                                          style={{
                                                            marginLeft: 12,
                                                            color: "#999",
                                                            fontSize: 11,
                                                            marginTop: 2,
                                                          }}
                                                        >
                                                          {new Date(
                                                            user.decidedAt
                                                          ).toLocaleString(
                                                            "vi-VN"
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {pendingUsers.length === 0 &&
                                            rejectUsers.length === 0 &&
                                            confirmedUsers.length > 0 && (
                                              <Text
                                                type="secondary"
                                                style={{ color: "#52c41a" }}
                                              >
                                                ✓ Tất cả đã bỏ phiếu và không có ai
                                                từ chối
                                              </Text>
                                            )}
                                          {votingData.length === 0 && (
                                            <Text type="secondary">
                                              Chưa có dữ liệu bỏ phiếu
                                            </Text>
                                          )}
                                        </div>
                                      );
                                    };

                                    return (
                                      <Popover
                                        key="status"
                                        content={renderVotingContent()}
                                        trigger="hover"
                                        placement="topLeft"
                                        onVisibleChange={(visible) => {
                                          if (
                                            visible &&
                                            !votingStatus &&
                                            !isLoading
                                          ) {
                                            fetchVotingStatus(sr.id);
                                          }
                                        }}
                                      >
                                        <Tag
                                          color={statusInfo.color}
                                          style={{ cursor: "pointer" }}
                                        >
                                          {statusInfo.text}
                                          {/* Chỉ hiển thị số đếm trên tag khi status là VOTING */}
                                          {hasVotingData &&
                                            isVoting &&
                                            ` (${votedCount}/${totalMembers})`}
                                        </Tag>
                                      </Popover>
                                    );
                                  };

                                  return (
                                    <List.Item
                                      actions={[
                                        <Tag key="type" color={typeInfo.color}>
                                          {typeInfo.text}
                                        </Tag>,
                                        renderVotingTag(),
                                        // Show user's decision if already decided
                                        alreadyDecided && userDecision ? (
                                          <Tooltip
                                            key="my-decision"
                                            title={
                                              userDecision.reason
                                                ? `Lý do: ${userDecision.reason}`
                                                : "Không có lý do"
                                            }
                                          >
                                            <Tag
                                              color={
                                                userDecision.decision ===
                                                "CONFIRM"
                                                  ? "green"
                                                  : "red"
                                              }
                                            >
                                              Bạn{" "}
                                              {userDecision.decision ===
                                              "CONFIRM"
                                                ? "đã xác nhận"
                                                : "đã từ chối"}
                                            </Tag>
                                          </Tooltip>
                                        ) : null,
                                        // Show Confirm button only if: 1) in VOTING status, 2) not decided yet
                                        isVoting && !alreadyDecided ? (
                                          <Button
                                            key="confirm"
                                            type="primary"
                                            size="small"
                                            onClick={() =>
                                              openConfirmModal(sr, true)
                                            }
                                          >
                                            Xác nhận
                                          </Button>
                                        ) : null,
                                        // Show Reject button only if: 1) in VOTING status, 2) not decided yet
                                        isVoting && !alreadyDecided ? (
                                          <Button
                                            key="reject"
                                            danger
                                            size="small"
                                            onClick={() =>
                                              openConfirmModal(sr, false)
                                            }
                                          >
                                            Từ chối
                                          </Button>
                                        ) : null,
                                      ].filter(Boolean)}
                                    >
                                      <List.Item.Meta
                                        title={
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                            }}
                                          >
                                            <span>{sr.title || sr.id}</span>
                                            <Button
                                              type="link"
                                              size="small"
                                              icon={<EyeOutlined />}
                                              onClick={() =>
                                                fetchServiceRequestDetails(
                                                  sr.id
                                                )
                                              }
                                              style={{
                                                padding: 0,
                                                height: "auto",
                                              }}
                                            ></Button>
                                          </div>
                                        }
                                        description={
                                          <div>
                                            {sr.description && (
                                              <div style={{ marginBottom: 4 }}>
                                                {sr.description}
                                              </div>
                                            )}
                                            {sr.costEstimate ? (
                                              <span>
                                                Ước tính chi phí:{" "}
                                                {(
                                                  sr.costEstimate / 1000
                                                ).toFixed(0)}
                                                K VNĐ
                                              </span>
                                            ) : null}
                                            {sr.createdAt ? (
                                              <span
                                                style={{
                                                  marginLeft: 8,
                                                  color: "#888",
                                                }}
                                              >
                                                {new Date(
                                                  sr.createdAt
                                                ).toLocaleDateString("en-US")}
                                              </span>
                                            ) : null}
                                          </div>
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
                          key: "groupExpenses",
                          label: "Chi phí nhóm",
                          children: (
                            <>
                              <List
                                loading={expensesLoading}
                                itemLayout="horizontal"
                                dataSource={groupExpenses}
                                locale={{
                                  emptyText: "Chưa có chi phí",
                                }}
                                renderItem={(expense) => {
                                  const statusMap = {
                                    CONFIRMED: {
                                      color: "green",
                                      text: "Đã xác nhận",
                                    },
                                    PENDING: {
                                      color: "orange",
                                      text: "Chờ xử lý",
                                    },
                                    REJECTED: {
                                      color: "red",
                                      text: "Đã từ chối",
                                    },
                                  };
                                  const statusInfo = statusMap[
                                    expense.status
                                  ] || {
                                    color: "default",
                                    text: expense.status,
                                  };

                                  return (
                                    <List.Item
                                      actions={[
                                        <Tag
                                          key="status"
                                          color={statusInfo.color}
                                        >
                                          {statusInfo.text}
                                        </Tag>,
                                        <Text
                                          key="amount"
                                          strong
                                          style={{ color: "#1890ff" }}
                                        >
                                          {(
                                            expense.amount || 0
                                          ).toLocaleString()}{" "}
                                          VNĐ
                                        </Text>,
                                      ].filter(Boolean)}
                                    >
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar
                                            style={{
                                              backgroundColor: "#87d068",
                                            }}
                                          >
                                            💰
                                          </Avatar>
                                        }
                                        title={
                                          expense.description || expense.id
                                        }
                                        description={
                                          <div>
                                            {expense.incurredAt && (
                                              <span style={{ color: "#888" }}>
                                                Phát sinh:{" "}
                                                {new Date(
                                                  expense.incurredAt
                                                ).toLocaleDateString("vi-VN")}
                                              </span>
                                            )}
                                          </div>
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
                          key: "myInvoices",
                          label: "Hóa đơn của tôi",
                          children: (
                            <>
                              <List
                                loading={invoicesLoading}
                                itemLayout="horizontal"
                                dataSource={myInvoices}
                                locale={{
                                  emptyText: "Chưa có hóa đơn",
                                }}
                                renderItem={(invoice) => {
                                  const statusMap = {
                                    DUE: { color: "orange", text: "Đến hạn" },
                                    PAID: { color: "green", text: "Đã thanh toán" },
                                    OVERDUE: { color: "red", text: "Quá hạn" },
                                    PENDING: { color: "blue", text: "Chờ xử lý" },
                                  };
                                  const statusInfo = statusMap[
                                    invoice.status
                                  ] || {
                                    color: "default",
                                    text: invoice.status,
                                  };

                                  const remaining =
                                    (invoice.totalAmount || 0) -
                                    (invoice.amountPaid || 0);

                                  return (
                                    <List.Item
                                      actions={[
                                        <Tag
                                          key="status"
                                          color={statusInfo.color}
                                        >
                                          {statusInfo.text}
                                        </Tag>,
                                        <div
                                          key="amounts"
                                          style={{ textAlign: "right" }}
                                        >
                                          <div>
                                            <Text
                                              strong
                                              style={{ color: "#1890ff" }}
                                            >
                                              {(
                                                invoice.totalAmount || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ
                                            </Text>
                                          </div>
                                          {invoice.amountPaid > 0 && (
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: "#52c41a",
                                              }}
                                            >
                                              Paid:{" "}
                                              {(
                                                invoice.amountPaid || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ
                                            </div>
                                          )}
                                          {remaining > 0 && (
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: "#ff4d4f",
                                              }}
                                            >
                                              Remaining:{" "}
                                              {remaining.toLocaleString()} VNĐ
                                            </div>
                                          )}
                                        </div>,
                                        invoice.status === "DUE" ? (
                                          <Button
                                            key="pay"
                                            type="primary"
                                            size="small"
                                            loading={paymentLoading}
                                            onClick={() => {
                                              handlePayment(invoice.id);
                                            }}
                                          >
                                            Pay
                                          </Button>
                                        ) : null,
                                        <Button
                                          key="view-detail"
                                          type="link"
                                          loading={invoiceDetailLoading}
                                          onClick={() =>
                                            loadInvoiceDetail(invoice.id)
                                          }
                                        >
                                          Xem chi tiết
                                        </Button>,
                                      ].filter(Boolean)}
                                    >
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar
                                            style={{
                                              backgroundColor: "#ff7a45",
                                            }}
                                          >
                                            🧾
                                          </Avatar>
                                        }
                                        title={invoice.title || "Hóa đơn"}
                                        description={
                                          <div>
                                            {invoice.createdAt && (
                                              <span style={{ color: "#888" }}>
                                                Tạo:{" "}
                                                {new Date(
                                                  invoice.createdAt
                                                ).toLocaleDateString("vi-VN")}
                                              </span>
                                            )}
                                          </div>
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
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
              <Empty description="Chưa chọn nhóm" />
            )}
          </Modal>

          <Modal
            open={attachOpen}
            title="Gắn xe vào nhóm này"
            onCancel={() => setAttachOpen(false)}
            footer={null}
            width={800}
          >
            <List
              loading={myVehiclesLoading}
              itemLayout="horizontal"
              dataSource={myVehicles.filter((v) => {
                // Filter out active vehicles (already in a group/active)
                const status = (v.status || "").toUpperCase();
                if (status === "ACTIVE") return false;

                const hasContract = v.hasContract || v.contractId || false;
                if (hasContract) return false; // Only show vehicles without contract

                // Consider a vehicle "attached" if it reports any group/co-ownership id
                const isAttached = Boolean(
                  v.groupId ||
                    v.group?.id ||
                    v.coOwnershipId ||
                    v.coOwnership?.id ||
                    v.ownerGroupId ||
                    v.parentGroupId
                );
                // Exclude vehicles that are already attached to a group
                if (isAttached) return false;

                return true;
              })}
              locale={{
                emptyText: "Không có xe nào khả dụng",
              }}
              renderItem={(v) => {
                const hasContract = v.hasContract || v.contractId || false;
                const displayName =
                  v.vehicleName ||
                  v.name ||
                  v.modelName ||
                  v.model ||
                  v.licensePlate ||
                  "Vehicle";

                // Parse images
                let images = [];
                try {
                  if (v.vehicleImageUrl) {
                    if (
                      typeof v.vehicleImageUrl === "string" &&
                      v.vehicleImageUrl.trim().startsWith("[")
                    ) {
                      images = JSON.parse(v.vehicleImageUrl);
                    } else {
                      images = [v.vehicleImageUrl];
                    }
                  }
                } catch (e) {
                  images = v.vehicleImageUrl ? [v.vehicleImageUrl] : [];
                }

                return (
                  <List.Item
                    actions={[
                      <Button
                        key="attach"
                        type="primary"
                        size="small"
                        loading={attachSubmitting}
                        onClick={() => attachVehicle(v.id)}
                      >
                        Gắn
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar>
                          {(displayName || "?")
                            .toString()
                            .slice(0, 1)
                            .toUpperCase()}
                        </Avatar>
                      }
                      title={displayName}
                      description={
                        <div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: "4px 16px",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <div>
                              <span style={{ color: "#888" }}>Biển số:</span>{" "}
                              {v.plateNumber || v.licensePlate || "-"}
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>Hãng:</span>{" "}
                              {v.make || v.brand || "-"}
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>Màu:</span>{" "}
                              {v.color || "-"}
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>Năm:</span>{" "}
                              {v.modelYear || v.year || "-"}
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>Pin:</span>{" "}
                              {v.batteryCapacityKwh || v.batteryKwh || "-"} kWh
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>
                                Tầm hoạt động:
                              </span>{" "}
                              {v.rangeKm || v.range || "-"} km
                            </div>
                          </div>

                          {v.id && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#999",
                                marginBottom: 8,
                              }}
                            >
                              ID: {v.id.substring(0, 8)}...
                            </div>
                          )}

                          {images.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Image.PreviewGroup>
                                <Space size={8} wrap>
                                  {images.map((url, idx) => (
                                    <Image
                                      key={idx}
                                      src={url}
                                      width={100}
                                      height={75}
                                      style={{
                                        objectFit: "cover",
                                        borderRadius: 4,
                                        border: "1px solid #f0f0f0",
                                      }}
                                    />
                                  ))}
                                </Space>
                              </Image.PreviewGroup>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Modal>

          <Modal
            open={createServiceOpen}
            title="Tạo yêu cầu dịch vụ"
            onCancel={() => {
              setCreateServiceOpen(false);
              setServiceForm({
                vehicleId: "",
                serviceCenterId: "",
                type: "MAINTENANCE",
                title: "",
                description: "",
              });
            }}
            onOk={createServiceRequest}
            okText="Tạo"
            okButtonProps={{
              loading: createServiceSubmitting,
              disabled:
                createServiceSubmitting ||
                !serviceForm.vehicleId ||
                !serviceForm.serviceCenterId ||
                !serviceForm.title,
            }}
            width={600}
          >
            <Spin spinning={loadingServiceCenters}>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <div>
                  <Text strong>Xe *</Text>
                  <select
                    value={serviceForm.vehicleId}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        vehicleId: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      marginTop: 4,
                    }}
                  >
                    <option value="">Chọn xe</option>
                    {vehicles.map((v) => {
                      const make = v.make || v.brand || "";
                      const model = v.model || "";
                      const plate = v.plateNumber || v.licensePlate || "";

                      let displayText = "";
                      if (make && model && plate) {
                        displayText = `${make} ${model} - ${plate}`;
                      } else if (make && model) {
                        displayText = `${make} ${model}`;
                      } else if (plate) {
                        displayText = plate;
                      } else {
                        displayText =
                          v.vehicleName || v.name || v.id || "Xe không xác định";
                      }

                      return (
                        <option key={v.id} value={v.id}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <Text strong>Trung tâm dịch vụ *</Text>
                  <select
                    value={serviceForm.serviceCenterId}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        serviceCenterId: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      marginTop: 4,
                    }}
                  >
                    <option value="">Chọn trung tâm dịch vụ</option>
                    {serviceCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name} - {center.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Text strong>Loại *</Text>
                  <select
                    value={serviceForm.type}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, type: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      marginTop: 4,
                    }}
                  >
                    <option value="MAINTENANCE">Bảo dưỡng</option>
                    <option value="REPAIR">Sửa chữa</option>
                    <option value="INSPECTION">Kiểm tra</option>
                    <option value="CLEANING">Vệ sinh</option>
                    <option value="UPGRADE">Nâng cấp</option>
                  </select>
                </div>

                <div>
                  <Text strong>Tiêu đề *</Text>
                  <Input
                    placeholder="Nhập tiêu đề yêu cầu dịch vụ"
                    value={serviceForm.title}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, title: e.target.value })
                    }
                    style={{ marginTop: 4 }}
                    maxLength={200}
                  />
                </div>

                <div>
                  <Text strong>Mô tả (Tùy chọn)</Text>
                  <Input.TextArea
                    placeholder="Nhập mô tả"
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value,
                      })
                    }
                    style={{ marginTop: 4 }}
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </Space>
            </Spin>
          </Modal>

          <Modal
            open={confirmModalOpen}
            title={
              confirmAction
                ? "Đã đồng ý yêu cầu dịch vụ"
                : "Đã từ chối yêu cầu dịch vụ"
            }
            onCancel={() => {
              setConfirmModalOpen(false);
              setConfirmingRequest(null);
              setConfirmReason("");
            }}
            onOk={submitConfirmation}
            okText={confirmAction ? "Đồng ý" : "Từ chối"}
            okButtonProps={{
              loading: confirmSubmitting,
              disabled:
                confirmSubmitting || (!confirmAction && !confirmReason.trim()),
              danger: !confirmAction,
            }}
            width={500}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {confirmingRequest && (
                <div>
                  <Text strong>Yêu cầu dịch vụ:</Text>
                  <div style={{ marginTop: 8, marginBottom: 16 }}>
                    <div>
                      <Text>
                        {confirmingRequest.title || confirmingRequest.id}
                      </Text>
                    </div>
                    {confirmingRequest.description && (
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {confirmingRequest.description}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Text strong>
                  Lý do{" "}
                  {!confirmAction && <span style={{ color: "red" }}>*</span>}
                </Text>
                <Input.TextArea
                  placeholder={
                    confirmAction
                      ? "Tùy chọn: Thêm ghi chú cho xác nhận của bạn"
                      : "Bắt buộc: Vui lòng cung cấp lý do từ chối"
                  }
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  style={{ marginTop: 4 }}
                  rows={4}
                  maxLength={500}
                />
              </div>
            </Space>
          </Modal>

          <Modal
            open={invoiceDetailOpen}
            title="Chi tiết hóa đơn"
            onCancel={() => {
              setInvoiceDetailOpen(false);
              setSelectedInvoice(null);
            }}
            footer={[
              selectedInvoice?.status === "DUE" ? (
                <Button
                  key="pay"
                  type="primary"
                  loading={paymentLoading}
                  onClick={() => {
                    handlePayment(selectedInvoice.id);
                  }}
                >
                  Thanh toán ngay
                </Button>
              ) : null,
              <Button
                key="close"
                onClick={() => {
                  setInvoiceDetailOpen(false);
                  setSelectedInvoice(null);
                }}
              >
                Đóng
              </Button>,
            ].filter(Boolean)}
            width={600}
          >
            <Spin spinning={invoiceDetailLoading}>
              {selectedInvoice ? (
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  {/* Title */}
                  {selectedInvoice.title && (
                    <div>
                      <Text strong>Tiêu đề:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>{selectedInvoice.title}</Text>
                      </div>
                    </div>
                  )}

                  {/* Amount Information */}
                  <div>
                    <Text strong>Thông tin số tiền:</Text>
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text>Tổng số tiền:</Text>
                        <Text
                          strong
                          style={{ color: "#1890ff", fontSize: "16px" }}
                        >
                          {(selectedInvoice.totalAmount || 0).toLocaleString()}{" "}
                          VNĐ
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text>Tỷ lệ sở hữu:</Text>
                        <Text strong style={{ color: "#722ed1" }}>
                          {(selectedInvoice.ownershipSharePercent || 0).toFixed(
                            2
                          )}
                          %
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text>Đã thanh toán:</Text>
                        <Text strong style={{ color: "#52c41a" }}>
                          {(selectedInvoice.amountPaid || 0).toLocaleString()}{" "}
                          VNĐ
                        </Text>
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text strong>Còn lại:</Text>
                        <Text
                          strong
                          style={{ color: "#ff4d4f", fontSize: "16px" }}
                        >
                          {(
                            (selectedInvoice.totalAmount || 0) -
                            (selectedInvoice.amountPaid || 0)
                          ).toLocaleString()}{" "}
                          VNĐ
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <Text strong>Trạng thái:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag
                        color={
                          selectedInvoice.status === "PAID"
                            ? "green"
                            : selectedInvoice.status === "OVERDUE"
                            ? "red"
                            : selectedInvoice.status === "DUE"
                            ? "orange"
                            : "blue"
                        }
                      >
                        {selectedInvoice.status}
                      </Tag>
                    </div>
                  </div>

                  {/* Created Date */}
                  {selectedInvoice.createdAt && (
                    <div>
                      <Text strong>Ngày tạo:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>
                          {new Date(selectedInvoice.createdAt).toLocaleString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </div>
                    </div>
                  )}
                </Space>
              ) : (
                <Empty description="Không có dữ liệu hóa đơn" />
              )}
            </Spin>
          </Modal>

          {/* Service Request Detail Modal */}
          <Modal
            title="Chi tiết Yêu cầu Dịch vụ"
            open={serviceRequestDetailOpen}
            onCancel={() => {
              setServiceRequestDetailOpen(false);
              setServiceRequestDetail(null);
            }}
            footer={[
              <Button
                key="close"
                type="primary"
                onClick={() => {
                  setServiceRequestDetailOpen(false);
                  setServiceRequestDetail(null);
                }}
              >
                Đóng
              </Button>,
            ]}
            width={1000}
            style={{ top: 5, paddingBottom: 0 }}
            bodyStyle={{
              padding: "8px",
              maxHeight: "calc(100vh - 80px)",
              overflowY: "hidden",
            }}
          >
            <Spin spinning={serviceRequestDetailLoading}>
              {serviceRequestDetail ? (
                <div style={{ padding: "0" }}>
                  <Row gutter={[8, 4]}>
                    {/* Left Column */}
                    <Col xs={24} sm={24} md={12}>
                      {/* Basic Information */}
                      <Card
                        size="small"
                        style={{ marginBottom: 4 }}
                        bodyStyle={{ padding: "8px" }}
                      >
                        <Title
                          level={5}
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            marginTop: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Thông tin cơ bản
                        </Title>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          labelStyle={{
                            width: "40%",
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          contentStyle={{
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          {serviceRequestDetail.title && (
                            <Descriptions.Item label="Tiêu đề">
                              {serviceRequestDetail.title}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.type && (
                            <Descriptions.Item label="Loại">
                              <Tag
                                color={
                                  serviceRequestDetail.type === "MAINTENANCE"
                                    ? "blue"
                                    : serviceRequestDetail.type === "REPAIR"
                                    ? "orange"
                                    : serviceRequestDetail.type === "INSPECTION"
                                    ? "green"
                                    : serviceRequestDetail.type === "CLEANING"
                                    ? "cyan"
                                    : serviceRequestDetail.type === "UPGRADE"
                                    ? "purple"
                                    : "default"
                                }
                              >
                                {serviceRequestDetail.type}
                              </Tag>
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.description && (
                            <Descriptions.Item label="Mô tả">
                              <Text style={{ wordBreak: "break-word" }}>
                                {serviceRequestDetail.description}
                              </Text>
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.status && (
                            <Descriptions.Item label="Trạng thái">
                              <Tag
                                color={
                                  serviceRequestDetail.status === "COMPLETED"
                                    ? "green"
                                    : serviceRequestDetail.status === "APPROVED"
                                    ? "green"
                                    : serviceRequestDetail.status === "REJECTED"
                                    ? "red"
                                    : serviceRequestDetail.status === "VOTING"
                                    ? "orange"
                                    : serviceRequestDetail.status ===
                                      "PENDING_QUOTE"
                                    ? "blue"
                                    : serviceRequestDetail.status ===
                                      "IN_PROGRESS"
                                    ? "blue"
                                    : serviceRequestDetail.status ===
                                      "INPROGRESS"
                                    ? "blue"
                                    : serviceRequestDetail.status === "DRAFT"
                                    ? "default"
                                    : "default"
                                }
                              >
                                {serviceRequestDetail.status}
                              </Tag>
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.costEstimate !== undefined &&
                            serviceRequestDetail.costEstimate !== null && (
                              <Descriptions.Item label="Chi phí ước tính">
                                {`${(
                                  serviceRequestDetail.costEstimate / 1000
                                ).toFixed(0)}K VNĐ`}
                              </Descriptions.Item>
                            )}
                          {serviceRequestDetail.reportUrl && (
                            <Descriptions.Item label="Báo cáo">
                              <Button
                                type="link"
                                icon={<DownloadOutlined />}
                                onClick={() =>
                                  handleDownloadReport(
                                    serviceRequestDetail.reportUrl
                                  )
                                }
                                style={{ padding: 0 }}
                              >
                                Tải báo cáo
                              </Button>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>

                      {/* Vehicle Information */}
                      <Card
                        size="small"
                        style={{ marginBottom: 4 }}
                        bodyStyle={{ padding: "8px" }}
                      >
                        <Title
                          level={5}
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            marginTop: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Thông tin xe
                        </Title>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          labelStyle={{
                            width: "40%",
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          contentStyle={{
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          {serviceRequestDetail.vehicleName && (
                            <Descriptions.Item label="Tên xe">
                              {serviceRequestDetail.vehicleName}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.plateNumber && (
                            <Descriptions.Item label="Biển số">
                              {serviceRequestDetail.plateNumber}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>

                      {/* Group Information */}
                      <Card
                        size="small"
                        style={{ marginBottom: 4 }}
                        bodyStyle={{ padding: "8px" }}
                      >
                        <Title
                          level={5}
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            marginTop: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Thông tin nhóm
                        </Title>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          labelStyle={{
                            width: "40%",
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          contentStyle={{
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          {serviceRequestDetail.groupName && (
                            <Descriptions.Item label="Tên nhóm">
                              {serviceRequestDetail.groupName}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.createdByName && (
                            <Descriptions.Item label="Người tạo">
                              {serviceRequestDetail.createdByName}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>

                      {/* Contract Information */}
                      {serviceRequestDetail.vehicleContractStatus && (
                        <Card
                          size="small"
                          style={{ marginBottom: 6 }}
                          bodyStyle={{ padding: "10px" }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 6,
                              fontSize: 13,
                              marginTop: 0,
                            }}
                          >
                            Thông tin hợp đồng
                          </Title>
                          <Descriptions
                            column={1}
                            size="small"
                            bordered
                            labelStyle={{
                              width: "40%",
                              padding: "4px 6px",
                              lineHeight: "1.3",
                            }}
                            contentStyle={{
                              padding: "4px 6px",
                              lineHeight: "1.3",
                            }}
                            style={{ fontSize: "12px" }}
                          >
                            <Descriptions.Item label="Trạng thái">
                              <Tag
                                color={
                                  serviceRequestDetail.vehicleContractStatus ===
                                  "APPROVED"
                                    ? "green"
                                    : serviceRequestDetail.vehicleContractStatus ===
                                      "PENDING"
                                    ? "orange"
                                    : serviceRequestDetail.vehicleContractStatus ===
                                      "REJECTED"
                                    ? "red"
                                    : "default"
                                }
                              >
                                {serviceRequestDetail.vehicleContractStatus}
                              </Tag>
                            </Descriptions.Item>
                            {serviceRequestDetail.contractEffectiveFrom && (
                              <Descriptions.Item label="Hiệu lực từ">
                                {formatDateTime(
                                  serviceRequestDetail.contractEffectiveFrom
                                )}
                              </Descriptions.Item>
                            )}
                            {serviceRequestDetail.contractExpiresAt && (
                              <Descriptions.Item label="Hết hạn">
                                {formatDateTime(
                                  serviceRequestDetail.contractExpiresAt
                                )}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Card>
                      )}
                    </Col>

                    {/* Right Column */}
                    <Col xs={24} sm={24} md={12}>
                      {/* Service Center Information */}
                      <Card
                        size="small"
                        style={{ marginBottom: 4 }}
                        bodyStyle={{ padding: "8px" }}
                      >
                        <Title
                          level={5}
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            marginTop: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Trung tâm dịch vụ
                        </Title>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          labelStyle={{
                            width: "40%",
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          contentStyle={{
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          {serviceRequestDetail.serviceCenterName && (
                            <Descriptions.Item label="Tên trung tâm">
                              {serviceRequestDetail.serviceCenterName}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.serviceCenterAddress && (
                            <Descriptions.Item label="Địa chỉ">
                              <Text style={{ wordBreak: "break-word" }}>
                                {serviceRequestDetail.serviceCenterAddress}
                              </Text>
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.technicianName && (
                            <Descriptions.Item label="Kỹ thuật viên">
                              {serviceRequestDetail.technicianName}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>

                      {/* Inspection Information */}
                      {serviceRequestDetail.inspectionScheduledAt && (
                        <Card
                          size="small"
                          style={{ marginBottom: 6 }}
                          bodyStyle={{ padding: "10px" }}
                        >
                          <Title
                            level={5}
                            style={{
                              marginBottom: 6,
                              fontSize: 13,
                              marginTop: 0,
                            }}
                          >
                            Thông tin kiểm tra
                          </Title>
                          <Descriptions
                            column={1}
                            size="small"
                            bordered
                            labelStyle={{
                              width: "40%",
                              padding: "4px 6px",
                              lineHeight: "1.3",
                            }}
                            contentStyle={{
                              padding: "4px 6px",
                              lineHeight: "1.3",
                            }}
                            style={{ fontSize: "12px" }}
                          >
                            <Descriptions.Item label="Lịch kiểm tra">
                              {formatDateTime(
                                serviceRequestDetail.inspectionScheduledAt
                              )}
                            </Descriptions.Item>
                            {serviceRequestDetail.inspectionNotes && (
                              <Descriptions.Item label="Ghi chú">
                                <Text style={{ wordBreak: "break-word" }}>
                                  {serviceRequestDetail.inspectionNotes}
                                </Text>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Card>
                      )}

                      {/* Timestamps */}
                      <Card size="small" bodyStyle={{ padding: "8px" }}>
                        <Title
                          level={5}
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            marginTop: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Thời gian
                        </Title>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          labelStyle={{
                            width: "40%",
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          contentStyle={{
                            padding: "4px 6px",
                            lineHeight: "1.3",
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          {serviceRequestDetail.createdAt && (
                            <Descriptions.Item label="Ngày tạo">
                              {formatDateTime(serviceRequestDetail.createdAt)}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.approvedAt && (
                            <Descriptions.Item label="Ngày phê duyệt">
                              {formatDateTime(serviceRequestDetail.approvedAt)}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.completedAt && (
                            <Descriptions.Item label="Ngày hoàn thành">
                              {formatDateTime(serviceRequestDetail.completedAt)}
                            </Descriptions.Item>
                          )}
                          {serviceRequestDetail.updatedAt && (
                            <Descriptions.Item label="Ngày cập nhật">
                              {formatDateTime(serviceRequestDetail.updatedAt)}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Spin>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default MyGroup;
