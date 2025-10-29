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
  const [togglingVehicleIds, setTogglingVehicleIds] = useState(new Set());
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [myVehicles, setMyVehicles] = useState([]);
  const [myVehiclesLoading, setMyVehiclesLoading] = useState(false);
  const [vehicleContractFilter, setVehicleContractFilter] = useState("all"); // all | with_contract | without_contract
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
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("members");
  const navigate = useNavigate();
  const location = useLocation();

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

  const loadServiceRequests = async (groupId) => {
    if (!groupId) {
      console.warn("[LOAD-SERVICE-REQUESTS] No groupId provided");
      setServiceRequests([]);
      return;
    }

    setServiceRequestsLoading(true);
    try {
      console.log(
        "[LOAD-SERVICE-REQUESTS] Fetching service requests for group:",
        groupId
      );

      let raw = [];

      // Use group-specific endpoint
      try {
        const endpoint = `/service-requests/my-group/${groupId}`;
        console.log("[LOAD-SERVICE-REQUESTS] Using endpoint:", endpoint);
        const response = await api.get(endpoint);
        console.log("[LOAD-SERVICE-REQUESTS] Response:", response.data);

        if (Array.isArray(response.data)) {
          raw = response.data;
        } else if (Array.isArray(response.data?.data)) {
          raw = response.data.data;
        }

        console.log(
          "[LOAD-SERVICE-REQUESTS] Loaded",
          raw.length,
          "service request(s)"
        );
      } catch (err) {
        console.error(
          "[LOAD-SERVICE-REQUESTS] Error loading service requests:",
          err
        );
        console.error(
          "[LOAD-SERVICE-REQUESTS] Error response:",
          err.response?.data
        );
        throw err;
      }

      setServiceRequests(raw);

      if (raw.length > 0) {
        console.log(
          "[LOAD-SERVICE-REQUESTS] Service requests loaded successfully"
        );
      }
    } catch (err) {
      console.error("[LOAD-SERVICE-REQUESTS] Failed to load service requests");
      toast.error("Failed to load service requests");
      setServiceRequests([]);
    } finally {
      setServiceRequestsLoading(false);
    }
  };

  const loadServiceCenters = async () => {
    setLoadingServiceCenters(true);
    try {
      console.log("[LOAD-SERVICE-CENTERS] Fetching service centers...");
      const response = await api.get("/service-centers");
      let centerList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      console.log(
        "[LOAD-SERVICE-CENTERS] Loaded",
        centerList.length,
        "centers"
      );
      setServiceCenters(centerList);
    } catch (error) {
      console.error("[LOAD-SERVICE-CENTERS] Error:", error);
      toast.error("Failed to load service centers");
      setServiceCenters([]);
    } finally {
      setLoadingServiceCenters(false);
    }
  };

  const loadMyConfirmations = async () => {
    setConfirmationsLoading(true);
    try {
      console.log("[LOAD-MY-CONFIRMATIONS] Fetching my confirmations...");
      const response = await api.get("/service-request-confirmations/my");
      let confirmationList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      console.log(
        "[LOAD-MY-CONFIRMATIONS] Loaded",
        confirmationList.length,
        "confirmations"
      );
      setMyConfirmations(confirmationList);
    } catch (error) {
      console.error("[LOAD-MY-CONFIRMATIONS] Error:", error);
      // Don't show error toast, just log it
      setMyConfirmations([]);
    } finally {
      setConfirmationsLoading(false);
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
      console.warn("[LOAD-GROUP-EXPENSES] No groupId provided");
      setGroupExpenses([]);
      return;
    }

    setExpensesLoading(true);
    try {
      console.log(
        "[LOAD-GROUP-EXPENSES] Fetching expenses for group:",
        groupId
      );

      const endpoint = `/group-expenses/group/${groupId}`;
      console.log("[LOAD-GROUP-EXPENSES] Using endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-GROUP-EXPENSES] Response:", response.data);

      let expenseList = [];
      if (Array.isArray(response.data)) {
        expenseList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        expenseList = response.data.data;
      }

      console.log(
        "[LOAD-GROUP-EXPENSES] Loaded",
        expenseList.length,
        "expense(s)"
      );
      setGroupExpenses(expenseList);
    } catch (err) {
      console.error("[LOAD-GROUP-EXPENSES] Error:", err);
      console.error(
        "[LOAD-GROUP-EXPENSES] Error response:",
        err.response?.data
      );
      toast.error("Failed to load group expenses");
      setGroupExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadMyInvoices = async () => {
    setInvoicesLoading(true);
    try {
      console.log("[LOAD-MY-INVOICES] Fetching my invoices...");

      const endpoint = "/member-invoices/my";
      console.log("[LOAD-MY-INVOICES] Using endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-MY-INVOICES] Response:", response.data);

      let invoiceList = [];
      if (Array.isArray(response.data)) {
        invoiceList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        invoiceList = response.data.data;
      }

      console.log(
        "[LOAD-MY-INVOICES] Loaded",
        invoiceList.length,
        "invoice(s)"
      );
      setMyInvoices(invoiceList);
    } catch (err) {
      console.error("[LOAD-MY-INVOICES] Error:", err);
      console.error("[LOAD-MY-INVOICES] Error response:", err.response?.data);
      toast.error("Failed to load invoices");
      setMyInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadInvoiceDetail = async (invoiceId) => {
    if (!invoiceId) return;

    setInvoiceDetailLoading(true);
    try {
      console.log("[LOAD-INVOICE-DETAIL] Fetching invoice detail:", invoiceId);

      const endpoint = `/member-invoices/${invoiceId}`;
      console.log("[LOAD-INVOICE-DETAIL] Using endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("[LOAD-INVOICE-DETAIL] Response:", response.data);

      let invoiceDetail = response.data?.data || response.data;
      setSelectedInvoice(invoiceDetail);
      setInvoiceDetailOpen(true);
    } catch (err) {
      console.error("[LOAD-INVOICE-DETAIL] Error:", err);
      console.error(
        "[LOAD-INVOICE-DETAIL] Error response:",
        err.response?.data
      );
      toast.error("Failed to load invoice details");
    } finally {
      setInvoiceDetailLoading(false);
    }
  };

  const handlePayment = async (invoiceId) => {
    if (!invoiceId) return;

    setPaymentLoading(true);
    try {
      const baseUrl = "https://swp391-project-evcs.onrender.com";
      const returnUrl = `${baseUrl}/view-mygroup?payment=success&invoiceId=${invoiceId}`;
      const cancelUrl = `${baseUrl}/view-mygroup?payment=cancelled&invoiceId=${invoiceId}`;

      console.log("[PAYMENT] ========== PAYMENT INITIATED ==========");
      console.log("[PAYMENT] Invoice ID:", invoiceId);
      console.log("[PAYMENT] API:", `/invoice-payments/${invoiceId}`);
      console.log("[PAYMENT] Return URL:", returnUrl);
      console.log("[PAYMENT] Cancel URL:", cancelUrl);

      const response = await api.post(`/invoice-payments/${invoiceId}`, null, {
        params: {
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        },
      });

      console.log("[PAYMENT] ========== RESPONSE RECEIVED ==========");
      console.log("[PAYMENT] Full Response:", response);
      console.log("[PAYMENT] Response Data:", response.data);
      console.log("[PAYMENT] Response Data Type:", typeof response.data);

      // Try multiple ways to get payment URL
      const paymentUrl =
        response.data?.checkoutUrl ||
        response.data?.data?.checkoutUrl ||
        response.data?.paymentUrl ||
        response.data?.data?.paymentUrl ||
        response.data?.url ||
        response.data?.data?.url ||
        response.data?.payment_url ||
        response.data?.data?.payment_url;

      console.log("[PAYMENT] Extracted Payment URL:", paymentUrl);

      if (paymentUrl) {
        console.log(
          "[PAYMENT] ✅ Payment URL found! Redirecting to:",
          paymentUrl
        );
        toast.success("Redirecting to payment gateway...");

        // Small delay to show toast
        setTimeout(() => {
          console.log("[PAYMENT] 🚀 Now redirecting...");
          window.location.href = paymentUrl;
        }, 500);
      } else {
        console.warn("[PAYMENT] ⚠️ No payment URL found in response");
        console.log(
          "[PAYMENT] Available keys in response.data:",
          Object.keys(response.data || {})
        );
        console.log(
          "[PAYMENT] Full response.data structure:",
          JSON.stringify(response.data, null, 2)
        );
        toast.error("Payment URL not found in response");
      }
    } catch (err) {
      console.error("[PAYMENT] ========== ERROR OCCURRED ==========");
      console.error("[PAYMENT] Error:", err);
      console.error("[PAYMENT] Error Response:", err.response);
      console.error("[PAYMENT] Error Data:", err.response?.data);
      toast.error(err?.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const createServiceRequest = async () => {
    if (!selectedGroup?.id) {
      toast.warning("No group selected");
      return;
    }
    if (
      !serviceForm.vehicleId ||
      !serviceForm.serviceCenterId ||
      !serviceForm.title
    ) {
      toast.warning(
        "Please fill in required fields (Vehicle, Service Center & Title)"
      );
      return;
    }

    setCreateServiceSubmitting(true);
    console.log("[CREATE-SERVICE-REQUEST] Starting creation with data:", {
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

      console.log("[CREATE-SERVICE-REQUEST] Response:", response.data);
      toast.success("Service request created successfully!");

      setCreateServiceOpen(false);
      setServiceForm({
        vehicleId: "",
        serviceCenterId: "",
        type: "MAINTENANCE",
        title: "",
        description: "",
      });

      console.log(
        "[CREATE-SERVICE-REQUEST] Reloading service requests for group:",
        selectedGroup.id
      );
      await loadServiceRequests(selectedGroup.id);
    } catch (err) {
      console.error("[CREATE-SERVICE-REQUEST] Error:", err);
      console.error(
        "[CREATE-SERVICE-REQUEST] Error response:",
        err.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Failed to create service request"
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
      toast.warning("No service request selected");
      return;
    }

    // Require reason for rejection
    if (!confirmAction && !confirmReason.trim()) {
      toast.warning("Please provide a reason for rejection");
      return;
    }

    setConfirmSubmitting(true);
    console.log("[CONFIRM-SERVICE-REQUEST] Submitting confirmation:", {
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
      console.log("[CONFIRM-SERVICE-REQUEST] Response:", response.data);

      toast.success(
        confirmAction
          ? "Service request confirmed successfully!"
          : "Service request rejected"
      );

      setConfirmModalOpen(false);
      setConfirmingRequest(null);
      setConfirmReason("");

      // Reload confirmations and service requests to update the list
      await loadMyConfirmations();
      if (selectedGroup?.id) {
        await loadServiceRequests(selectedGroup.id);
      }
    } catch (err) {
      console.error("[CONFIRM-SERVICE-REQUEST] Error:", err);
      console.error(
        "[CONFIRM-SERVICE-REQUEST] Error response:",
        err.response?.data
      );
      toast.error(
        err?.response?.data?.message || "Failed to submit confirmation"
      );
    } finally {
      setConfirmSubmitting(false);
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

    if (paymentStatus && invoiceId && groups.length > 0) {
      console.log("[PAYMENT-RETURN] Payment status:", paymentStatus);
      console.log("[PAYMENT-RETURN] Invoice ID:", invoiceId);

      // Show notification based on payment status
      if (paymentStatus === "success") {
        toast.success("Payment completed successfully!");
      } else if (paymentStatus === "cancelled") {
        toast.info("Payment was cancelled");
      }

      // Just open invoice detail modal, no need to open group modal
      const handlePaymentReturn = async () => {
        try {
          console.log("[PAYMENT-RETURN] Loading invoices...");
          // Load all invoices first to refresh the list
          await loadMyInvoices();

          console.log(
            "[PAYMENT-RETURN] Opening invoice detail modal for:",
            invoiceId
          );
          // Load invoice detail and open modal (standalone)
          await loadInvoiceDetail(invoiceId);
        } catch (err) {
          console.error("[PAYMENT-RETURN] Error:", err);
        }
      };

      handlePaymentReturn();

      // Clean up URL
      navigate("/view-mygroup", { replace: true });
    }
  }, [location.search, groups]);

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
        const expiresAtVal = expiresAt
          ? new Date(expiresAt).getTime()
          : Date.now() + 15 * 60 * 1000;
        setInviteExpiresAt(expiresAtVal);
        // Persist to storage so re-opening details retains countdown
        saveInviteToStorage(gid, code, expiresAtVal);
        // Open custom invite modal instead of simple Modal.success
        setInviteModalVisible(true);
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

  // Load my vehicles for attach modal
  const loadMyVehicles = async () => {
    setMyVehiclesLoading(true);
    try {
      console.log("[LOAD-MY-VEHICLES] Fetching vehicles...");
      const res = await api.get("/Vehicle/my-vehicles");
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.data)) list = res.data.data;
      else list = [];
      console.log("[LOAD-MY-VEHICLES] Loaded", list.length, "vehicles");
      setMyVehicles(list);
    } catch (err) {
      console.error("[LOAD-MY-VEHICLES] Error:", err);
      toast.error("Failed to load your vehicles");
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
      "[ATTACH-VEHICLE] Attaching vehicle:",
      vehicleId,
      "to group:",
      selectedGroup.id
    );

    try {
      const response = await api.post(`/CoOwnership/attach-vehicle`, {
        groupId: selectedGroup.id,
        vehicleId: vehicleId,
      });
      console.log("[ATTACH-VEHICLE] Success:", response.data);
      toast.success("Vehicle attached to group successfully!");
      await Promise.all([loadVehicles(selectedGroup.id), loadMyVehicles()]);
    } catch (err) {
      console.error("[ATTACH-VEHICLE] Error:", err);
      console.error("[ATTACH-VEHICLE] Error response:", err.response?.data);
      const backendMsg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;
      const isDuplicate =
        status === 409 ||
        /already|attached|tồn tại|trùng|được gắn|đã thuộc|đã được/i.test(
          backendMsg
        );
      if (isDuplicate) {
        toast.warning("Vehicle is already attached to another group");
      } else {
        toast.error(backendMsg || "Failed to attach vehicle");
      }
    } finally {
      setAttachSubmitting(false);
    }
  };

  const openAttachModal = async () => {
    setAttachOpen(true);
    await loadMyVehicles();
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

          {/* Invite modal - professional popup for showing invite code */}
          <Modal
            title="Invite code"
            open={inviteModalVisible}
            onCancel={() => setInviteModalVisible(false)}
            footer={
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div>
                  {inviteCode ? (
                    <Button onClick={copyInvite}>Copy code</Button>
                  ) : null}
                </div>
                <div>
                  <Button onClick={() => setInviteModalVisible(false)}>Close</Button>
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 14, color: "#595959" }}>Share this code with others to let them join the group.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Input readOnly value={inviteCode} style={{ fontSize: 18, fontWeight: 600 }} />
                <Tag color="purple">{inviteCode}</Tag>
              </div>
              <div style={{ color: "#8c8c8c" }}>
                Expires in {inviteCountdown === "expired" ? "00:00" : inviteCountdown || "15:00"}
              </div>
              <div>
                <Button type="link" onClick={() => { navigator.clipboard.writeText(inviteCode); message.success("Copied invite code"); }}>
                  Copy to clipboard
                </Button>
              </div>
            </div>
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
                  {/* Show Delete only when user is owner, group has no contract and
                      the group contains only the owner (single owner only) */}
                  {selectedGroup &&
                  isCurrentUserOwner(selectedGroup, members) &&
                  selectedGroup._singleOwnerOnly &&
                  !selectedGroup._hasContract ? (
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
                      activeKey={activeTabKey}
                      onChange={(key) => setActiveTabKey(key)}
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
                                    <Button onClick={openAttachModal}>
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
                        {
                          key: "serviceRequests",
                          label: "Service Requests",
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
                                  Create Service Request
                                </Button>
                              </div>
                              <Divider style={{ margin: "12px 0" }} />
                              <List
                                loading={serviceRequestsLoading}
                                itemLayout="horizontal"
                                dataSource={serviceRequests}
                                locale={{
                                  emptyText: "No service requests yet",
                                }}
                                renderItem={(sr) => {
                                  const statusMap = {
                                    draft: { color: "default", text: "Draft" },
                                    DRAFT: { color: "default", text: "Draft" },
                                    pending_quote: {
                                      color: "blue",
                                      text: "Pending Quote",
                                    },
                                    PENDING_QUOTE: {
                                      color: "blue",
                                      text: "Pending Quote",
                                    },
                                    voting: { color: "orange", text: "Voting" },
                                    VOTING: { color: "orange", text: "Voting" },
                                    approved: {
                                      color: "green",
                                      text: "Approved",
                                    },
                                    APPROVED: {
                                      color: "green",
                                      text: "Approved",
                                    },
                                    rejected: {
                                      color: "red",
                                      text: "Rejected",
                                    },
                                    REJECTED: {
                                      color: "red",
                                      text: "Rejected",
                                    },
                                    in_progress: {
                                      color: "processing",
                                      text: "In Progress",
                                    },
                                    IN_PROGRESS: {
                                      color: "processing",
                                      text: "In Progress",
                                    },
                                    completed: {
                                      color: "success",
                                      text: "Completed",
                                    },
                                    COMPLETED: {
                                      color: "success",
                                      text: "Completed",
                                    },
                                  };
                                  const typeMap = {
                                    MAINTENANCE: {
                                      color: "blue",
                                      text: "Maintenance",
                                    },
                                    REPAIR: { color: "orange", text: "Repair" },
                                    INSPECTION: {
                                      color: "green",
                                      text: "Inspection",
                                    },
                                    CLEANING: {
                                      color: "cyan",
                                      text: "Cleaning",
                                    },
                                    UPGRADE: {
                                      color: "purple",
                                      text: "Upgrade",
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

                                  return (
                                    <List.Item
                                      actions={[
                                        <Tag key="type" color={typeInfo.color}>
                                          {typeInfo.text}
                                        </Tag>,
                                        <Tag
                                          key="status"
                                          color={statusInfo.color}
                                        >
                                          {statusInfo.text}
                                        </Tag>,
                                        // Show user's decision if already decided
                                        alreadyDecided && userDecision ? (
                                          <Tooltip
                                            key="my-decision"
                                            title={
                                              userDecision.reason
                                                ? `Reason: ${userDecision.reason}`
                                                : "No reason provided"
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
                                              You{" "}
                                              {userDecision.decision ===
                                              "CONFIRM"
                                                ? "Confirmed"
                                                : "Rejected"}
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
                                            Confirm
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
                                            Reject
                                          </Button>
                                        ) : null,
                                      ].filter(Boolean)}
                                    >
                                      <List.Item.Meta
                                        title={sr.title || sr.id}
                                        description={
                                          <div>
                                            {sr.description && (
                                              <div style={{ marginBottom: 4 }}>
                                                {sr.description}
                                              </div>
                                            )}
                                            {sr.costEstimate ? (
                                              <span>
                                                Cost Estimate:{" "}
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
                          label: "Group Expenses",
                          children: (
                            <>
                              <List
                                loading={expensesLoading}
                                itemLayout="horizontal"
                                dataSource={groupExpenses}
                                locale={{
                                  emptyText: "No expenses yet",
                                }}
                                renderItem={(expense) => {
                                  const statusMap = {
                                    CONFIRMED: {
                                      color: "green",
                                      text: "Confirmed",
                                    },
                                    PENDING: {
                                      color: "orange",
                                      text: "Pending",
                                    },
                                    REJECTED: {
                                      color: "red",
                                      text: "Rejected",
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
                                                Incurred:{" "}
                                                {new Date(
                                                  expense.incurredAt
                                                ).toLocaleDateString("en-US")}
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
                          label: "My Invoices",
                          children: (
                            <>
                              <List
                                loading={invoicesLoading}
                                itemLayout="horizontal"
                                dataSource={myInvoices}
                                locale={{
                                  emptyText: "No invoices yet",
                                }}
                                renderItem={(invoice) => {
                                  const statusMap = {
                                    DUE: { color: "orange", text: "Due" },
                                    PAID: { color: "green", text: "Paid" },
                                    OVERDUE: { color: "red", text: "Overdue" },
                                    PENDING: { color: "blue", text: "Pending" },
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
                                            onClick={() =>
                                              handlePayment(invoice.id)
                                            }
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
                                          View Details
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
                                        title={invoice.title || "Invoice"}
                                        description={
                                          <div>
                                            {invoice.createdAt && (
                                              <span style={{ color: "#888" }}>
                                                Created:{" "}
                                                {new Date(
                                                  invoice.createdAt
                                                ).toLocaleDateString("en-US")}
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
              <Empty description="No group selected" />
            )}
          </Modal>

          <Modal
            open={attachOpen}
            title="Attach vehicle to this group"
            onCancel={() => setAttachOpen(false)}
            footer={null}
            width={800}
          >
            <Space style={{ marginBottom: 12 }}>
              <Text>Filter by contract status:</Text>
              <select
                value={vehicleContractFilter}
                onChange={(e) => setVehicleContractFilter(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                }}
              >
                <option value="all">All Vehicles</option>
                <option value="with_contract">With Contract</option>
                <option value="without_contract">Without Contract</option>
              </select>
            </Space>
            <List
              loading={myVehiclesLoading}
              itemLayout="horizontal"
              dataSource={myVehicles.filter((v) => {
                const hasContract = v.hasContract || v.contractId || false;
                if (vehicleContractFilter === "with_contract")
                  return hasContract;
                if (vehicleContractFilter === "without_contract")
                  return !hasContract;
                return true;
              })}
              locale={{
                emptyText: "No vehicles available",
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
                return (
                  <List.Item
                    actions={[
                      hasContract ? (
                        <Tag color="green" key="contract">
                          Has Contract
                        </Tag>
                      ) : (
                        <Tag color="red" key="no-contract">
                          No Contract
                        </Tag>
                      ),
                      !hasContract ? (
                        <Button
                          key="attach"
                          type="primary"
                          size="small"
                          loading={attachSubmitting}
                          onClick={() => attachVehicle(v.id)}
                        >
                          Attach
                        </Button>
                      ) : null,
                    ].filter(Boolean)}
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
                          {v.licensePlate && <div>Plate: {v.licensePlate}</div>}
                          {v.id && (
                            <div style={{ fontSize: "12px", color: "#999" }}>
                              ID: {v.id.substring(0, 8)}...
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
            title="Create Service Request"
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
            okText="Create"
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
                  <Text strong>Vehicle *</Text>
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
                    <option value="">Select a vehicle</option>
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
                          v.vehicleName || v.name || v.id || "Unknown Vehicle";
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
                  <Text strong>Service Center *</Text>
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
                    <option value="">Select a service center</option>
                    {serviceCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name} - {center.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Text strong>Type *</Text>
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
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="REPAIR">Repair</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="UPGRADE">Upgrade</option>
                  </select>
                </div>

                <div>
                  <Text strong>Title *</Text>
                  <Input
                    placeholder="Enter service request title"
                    value={serviceForm.title}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, title: e.target.value })
                    }
                    style={{ marginTop: 4 }}
                    maxLength={200}
                  />
                </div>

                <div>
                  <Text strong>Description (Optional)</Text>
                  <Input.TextArea
                    placeholder="Enter description"
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
                ? "Confirm Service Request"
                : "Reject Service Request"
            }
            onCancel={() => {
              setConfirmModalOpen(false);
              setConfirmingRequest(null);
              setConfirmReason("");
            }}
            onOk={submitConfirmation}
            okText={confirmAction ? "Confirm" : "Reject"}
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
                  <Text strong>Service Request:</Text>
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
                  Reason{" "}
                  {!confirmAction && <span style={{ color: "red" }}>*</span>}
                </Text>
                <Input.TextArea
                  placeholder={
                    confirmAction
                      ? "Optional: Add a note for your confirmation"
                      : "Required: Please provide a reason for rejection"
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
            title="Invoice Details"
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
                  Pay Now
                </Button>
              ) : null,
              <Button
                key="close"
                onClick={() => {
                  setInvoiceDetailOpen(false);
                  setSelectedInvoice(null);
                }}
              >
                Close
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
                      <Text strong>Title:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>{selectedInvoice.title}</Text>
                      </div>
                    </div>
                  )}

                  {/* Amount Information */}
                  <div>
                    <Text strong>Amount Information:</Text>
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text>Total Amount:</Text>
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
                        <Text>Amount Paid:</Text>
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
                        <Text strong>Remaining:</Text>
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
                    <Text strong>Status:</Text>
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
                      <Text strong>Created Date:</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text>
                          {new Date(selectedInvoice.createdAt).toLocaleString(
                            "en-US",
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
                <Empty description="No invoice data" />
              )}
            </Spin>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default MyGroup;
