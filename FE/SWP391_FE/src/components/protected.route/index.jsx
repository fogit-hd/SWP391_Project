import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../utils/jwt";

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

  // Handle array of roleIds (multiple roles allowed)
  if (Array.isArray(roleId)) {
    if (roleId.includes(currentRoleId)) {
      return children;
    }
    // Admin can access everything
    if (currentRoleId === 1) {
      return children;
    }
  } else {
    // Single roleId (original logic)
    // Check role access
    // Admin (1) can access everything
    if (currentRoleId === 1) {
      return children;
    }

    // Staff (2) can access Staff and CoOwner pages
    if (currentRoleId === 2 && roleId >= 2) {
      return children;
    }

    // Technician (3) can only access CoOwner pages
    if (currentRoleId === 3 && roleId >= 3) {
      return children;
    }

    // Co-Owner (4) has the most limited access
    if (currentRoleId === 4 && roleId >= 4) {
      return children;
    }

    // Exact match
    if (currentRoleId === roleId) {
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
