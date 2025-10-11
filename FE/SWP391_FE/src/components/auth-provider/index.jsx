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

          // Decode JWT để lấy roleId
          const jwtPayload = JSON.parse(
            atob(parsedUserData.accessToken.split(".")[1])
          );
          const roleMapping = {
            Admin: 1,
            Staff: 2,
            CoOwner: 3,
          };

          const roleId = roleMapping[jwtPayload.role] || 3; // Default to CoOwner

          // Tạo user object với roleId
          const userWithRoleId = {
            ...parsedUserData,
            roleId: roleId,
            role: jwtPayload.role,
            email: jwtPayload.email,
            name: jwtPayload.name,
          };

          dispatch(restoreUser(userWithRoleId));
          console.log("User data restored from localStorage:", userWithRoleId);
          console.log("Role mapping:", jwtPayload.role, "->", roleId);
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          localStorage.removeItem("userData");
          localStorage.removeItem("token");
        }
      } else {
        console.log("No token or userData found in localStorage");
      }
    };

    restoreUserData();
  }, [dispatch]);

  return children;
}

export default AuthProvider;
