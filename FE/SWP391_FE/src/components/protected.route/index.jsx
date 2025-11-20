import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserInfo, hasRole, getRoleName } from "../utils/jwt";

/**
 * Get dashboard path based on user role
 * @param {number} roleId - User's role ID
 * @returns {string} - Dashboard path
 */
const getDashboardPath = (roleId) => {
  const roleMap = {
    1: "/admin/dashboard",      // Admin
    2: "/staff/dashboard",       // Staff
    3: "/",                      // CoOwner (homepage)
    4: "/technician/dashboard",  // Technician
  };
  return roleMap[roleId] || "/";
};

function ProtectedRoute({ roleId, children }) {
  const account = useSelector((store) => store.account);
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  console.log("ProtectedRoute - account:", account);
  console.log("ProtectedRoute - userInfo:", userInfo);
  console.log("ProtectedRoute - required roleId:", roleId);

  // Check if user is authenticated
  if (!account && !userInfo) {
    return (
      <Result
        status="401"
        title="401"
        subTitle="Please login to access this page."
        extra={
          <Button onClick={() => navigate("/login")} type="primary">
            Go to Login
          </Button>
        }
      />
    );
  }

  const currentRoleId = account?.roleId || userInfo?.roleId;
  console.log("ProtectedRoute - current roleId:", currentRoleId);

  if (!currentRoleId) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này"
        extra={
          <Button onClick={() => navigate("/")} type="primary">
            Về trang chủ
          </Button>
        }
      />
    );
  }

  // Get dashboard path and role name for current user role (safe with null check)
  const dashboardPath = getDashboardPath(currentRoleId);
  const roleName = currentRoleId ? getRoleName(currentRoleId) : "Unknown";

  // Handle array of roleIds (multiple roles allowed)
  if (Array.isArray(roleId)) {
    // Special case: If CoOwner pages (3) are in the array, only CoOwner (3) and Admin (1) can access
    if (roleId.includes(3)) {
      // CoOwner pages are EXCLUSIVE - only CoOwner (3) and Admin (1) can access
      if (currentRoleId === 3 || currentRoleId === 1) {
        return children;
      }
      // If user is not CoOwner or Admin, deny access even if their role is in the array
      console.log('[ProtectedRoute] CoOwner pages (3) are EXCLUSIVE - denying access for role:', currentRoleId);
    } else {
      // For non-CoOwner pages, check if user's role is in the allowed list
      if (roleId.includes(currentRoleId)) {
        return children;
      }
      // Check if user has access to any of the required roles using hasRole
      const hasAccess = roleId.some((requiredRoleId) => hasRole(currentRoleId, requiredRoleId));
      if (hasAccess) {
        return children;
      }
    }
  } else {
    // Single roleId - use hasRole function from JWT utils
    // This function handles all role hierarchy logic correctly:
    // - Admin (1): Can access everything
    // - Staff (2): Can access Staff (2) pages only
    // - CoOwner (3): Can access CoOwner (3) pages only (EXCLUSIVE)
    // - Technician (4): Can access Technician (4) pages only
    if (hasRole(currentRoleId, roleId)) {
      return children;
    }
  }

  // No access - redirect to user's dashboard based on their role
  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này"
      extra={
        <Button onClick={() => navigate(dashboardPath)} type="primary">
          Về trang {roleName}
        </Button>
      }
    />
  );
}

export default ProtectedRoute;
