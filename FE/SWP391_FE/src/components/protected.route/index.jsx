import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserInfo, hasRole } from "../utils/jwt";

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

  // Handle array of roleIds (multiple roles allowed)
  if (Array.isArray(roleId)) {
    // Check if user's role is in the allowed list
    if (roleId.includes(currentRoleId)) {
      return children;
    }
    // Check if user has access to any of the required roles using hasRole
    const hasAccess = roleId.some((requiredRoleId) => hasRole(currentRoleId, requiredRoleId));
    if (hasAccess) {
      return children;
    }
  } else {
    // Single roleId - use hasRole function from JWT utils
    // This function handles all role hierarchy logic correctly:
    // - Admin (1): Can access everything
    // - Staff (2): Can access Staff (2) and CoOwner (3) pages
    // - CoOwner (3): Can access CoOwner (3) pages only
    // - Technician (4): Can access Technician (4) and CoOwner (3) pages
    if (hasRole(currentRoleId, roleId)) {
      return children;
    }
  }

  // No access
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

export default ProtectedRoute;
