import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { restoreUser } from "../../redux/accountSlice";
import { getUserInfo, isTokenExpired } from "../../utils/jwt";

function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreUserData = () => {
      const token = localStorage.getItem("token")?.replaceAll('"', "");
      
      if (!token) {
        console.log("No token found in localStorage");
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log("Token is expired, clearing authentication data");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("profileData");
        return;
      }

      try {
        // Get user info from JWT and localStorage
        const userInfo = getUserInfo();
        
        if (userInfo) {
          dispatch(restoreUser(userInfo));
          console.log("User data restored from JWT and localStorage:", userInfo);
        } else {
          console.log("Failed to extract user info from token");
        }
      } catch (error) {
        console.error("Failed to restore user data in AuthProvider:", error);
        // Don't clear tokens on parse error - just log the error
      }
    };

    restoreUserData();
  }, [dispatch]);

  return children;
}

export default AuthProvider;
