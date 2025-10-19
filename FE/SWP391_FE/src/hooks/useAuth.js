import { useSelector } from "react-redux";
import { getUserInfo, getRoleName, hasRole, isTokenExpired } from "../utils/jwt";

/**
 * Custom hook for authentication and authorization
 * 
 * @returns {object} - Authentication state and utilities
 */
export const useAuth = () => {
    const account = useSelector((state) => state.account);

    // Get user info from JWT and localStorage
    const userInfo = getUserInfo();

    // Check if user is authenticated
    const isAuthenticated = !!account && !!userInfo;

    // Check if token is expired
    const token = localStorage.getItem("token");
    const isExpired = isTokenExpired(token);

    // Get user role info
    const roleId = account?.roleId || userInfo?.roleId;
    const roleName = getRoleName(roleId);

    // Check if user has specific role
    const hasRoleAccess = (requiredRoleId) => {
        return hasRole(roleId, requiredRoleId);
    };

    // Check if user is admin
    const isAdmin = roleId === 1;

    // Check if user is staff
    const isStaff = roleId === 2;

    // Check if user is co-owner
    const isCoOwner = roleId === 3;

    return {
        // User data
        user: account || userInfo,
        userInfo,

        // Authentication state
        isAuthenticated: isAuthenticated && !isExpired,
        isExpired,

        // Role info
        roleId,
        roleName,

        // Role checks
        hasRoleAccess,
        isAdmin,
        isStaff,
        isCoOwner,

        // Utility functions
        getRoleName: (id) => getRoleName(id),
    };
};
