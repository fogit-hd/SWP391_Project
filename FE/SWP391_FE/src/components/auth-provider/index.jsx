import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { restoreUser } from "../../redux/accountSlice";

function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreUserData = () => {
      const token = localStorage.getItem("token")?.replaceAll('"', "");
      const userData = localStorage.getItem("userData");

      if (token && userData) {
        try {
          // Khôi phục user data từ localStorage
          const parsedUserData = JSON.parse(userData);

          // Đơn giản hóa: chỉ lấy roleId trực tiếp từ userData, không decode JWT
          const roleId = parsedUserData.roleId || 3; // Default to CoOwner (3)

          // Tạo user object với roleId
          const userWithRoleId = {
            ...parsedUserData,
            roleId: roleId,
          };

          dispatch(restoreUser(userWithRoleId));
          console.log("User data restored from localStorage");
        } catch (error) {
          console.error("Failed to parse user data in AuthProvider:", error);
          // Don't clear tokens on parse error - just log the error
        }
      } else {
        console.log("No authentication data found in localStorage");
      }
    };

    restoreUserData();
  }, [dispatch]);

  return children;
}

export default AuthProvider;
