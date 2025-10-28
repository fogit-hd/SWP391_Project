import { useSelector } from "react-redux";
import { getUserInfo, getRoleName, hasRole, isTokenExpired } from "../utils/jwt";

/**
 * Custom hook for authentication and authorization
 * 
 * ROLES:
 * - 1: Admin (Full access to all features)
 * - 2: Staff (Access to staff dashboard and contract review + CoOwner pages)
 * - 3: CoOwner (Access to co-ownership features only)
 * - 4: Technician (Access to technician dashboard and service review + CoOwner pages)
 * 
 * @returns {object} - Authentication state and utilities
 */
export const useAuth = () => {
    console.log('[HOOK] === useAuth called ===');

    const account = useSelector((state) => state.account);
    console.log('[HOOK] Redux account state:', {
        exists: !!account,
        id: account?.id,
        roleId: account?.roleId,
        role: account?.role
    });

    // Get user info from JWT and localStorage
    const userInfo = getUserInfo();
    console.log('[HOOK] userInfo from JWT/localStorage:', {
        exists: !!userInfo,
        id: userInfo?.id,
        roleId: userInfo?.roleId,
        roleName: userInfo?.roleName
    });

    // Check if user is authenticated (either from Redux or localStorage)
    const isAuthenticated = !!account || !!userInfo;
    console.log('[HOOK] isAuthenticated:', isAuthenticated);

    // Check if token is expired
    const token = localStorage.getItem("token");
    const isExpired = isTokenExpired(token);
    console.log('[HOOK] Token expiration status:', {
        token: token ? '✓ Exists' : '✗ Missing',
        isExpired: isExpired
    });

    // Get user role info
    const roleId = account?.roleId || userInfo?.roleId;
    const roleName = getRoleName(roleId);

    console.log('[HOOK] Role info:', {
        roleId,
        roleName,
        source: account?.roleId ? 'Redux' : 'JWT/localStorage'
    });

    // Check if user has specific role
    const hasRoleAccess = (requiredRoleId) => {
        const access = hasRole(roleId, requiredRoleId);
        console.log('[HOOK] hasRoleAccess check:', {
            roleId,
            requiredRoleId,
            hasAccess: access
        });
        return access;
    };

    // Check if user is admin
    const isAdmin = roleId === 1;
    console.log('[HOOK] isAdmin:', isAdmin);

    // Check if user is staff
    const isStaff = roleId === 2;
    console.log('[HOOK] isStaff:', isStaff);

    // Check if user is co-owner
    const isCoOwner = roleId === 3;
    console.log('[HOOK] isCoOwner:', isCoOwner);

    // Check if user is technician
    const isTechnician = roleId === 4;
    console.log('[HOOK] isTechnician:', isTechnician);

    console.log('[HOOK] === useAuth end ===\n');

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
        isTechnician,
        isCoOwner,

        // Utility functions
        getRoleName: (id) => getRoleName(id),
    };
};
