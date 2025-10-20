/**
 * JWT Utility Functions
 * 
 * This module provides utilities for working with JWT tokens,
 * including decoding and extracting user information.
 */

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
    try {
        if (!token) return null;

        // Remove quotes if present
        const cleanToken = token.replace(/"/g, '');

        // Split token into parts
        const parts = cleanToken.split('.');
        if (parts.length !== 3) return null;

        // Decode payload (second part)
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

        return JSON.parse(decoded);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

/**
 * Extract roleId from JWT token
 * @param {string} token - JWT token
 * @returns {number|null} - Role ID or null if not found
 */
export const getRoleIdFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    // Get role from JWT
    const role = decoded.roleId || decoded.role || decoded.role_id;

    // Convert string role to numeric roleId
    const roleMapping = {
        'Admin': 1,
        'Staff': 2,
        'CoOwner': 3,
        1: 1,
        2: 2,
        3: 3,
    };

    return roleMapping[role] || null;
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    return decoded.id || decoded.userId || decoded.sub || null;
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
};

/**
 * Get user role name from roleId
 * @param {number} roleId - Role ID
 * @returns {string} - Role name
 */
export const getRoleName = (roleId) => {
    // Handle both string and numeric roleId
    const roleMap = {
        1: 'Admin',
        2: 'Staff',
        3: 'CoOwner',
        'Admin': 'Admin',
        'Staff': 'Staff',
        'CoOwner': 'CoOwner',
    };
    return roleMap[roleId] || 'Unknown';
};

/**
 * Check if user has required role
 * @param {number} userRoleId - User's role ID
 * @param {number} requiredRoleId - Required role ID
 * @returns {boolean} - True if user has required role or higher
 */
export const hasRole = (userRoleId, requiredRoleId) => {
    if (!userRoleId || !requiredRoleId) return false;

    // Admin (1) has access to everything
    if (userRoleId === 1) return true;

    // Staff (2) has access to Staff and CoOwner pages
    if (userRoleId === 2 && requiredRoleId >= 2) return true;

    // CoOwner (3) only has access to CoOwner pages
    if (userRoleId === 3 && requiredRoleId === 3) return true;

    return false;
};

/**
 * Get user info from token and localStorage
 * @returns {object|null} - User info or null
 */
export const getUserInfo = () => {
    try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        console.log('getUserInfo - token:', !!token);
        console.log('getUserInfo - userData:', !!userData);

        if (!token) return null;

        // Try to get roleId from JWT first
        const roleId = getRoleIdFromToken(token);
        const userId = getUserIdFromToken(token);

        console.log('getUserInfo - JWT roleId:', roleId);
        console.log('getUserInfo - JWT userId:', userId);

        // If we have userData in localStorage, use it as fallback
        let parsedUserData = {};
        if (userData) {
            try {
                parsedUserData = JSON.parse(userData);
                console.log('getUserInfo - parsedUserData:', parsedUserData);
                console.log('getUserInfo - parsedUserData.roleId:', parsedUserData.roleId);
            } catch (error) {
                console.error('Error parsing userData:', error);
            }
        }

        // Use roleId from JWT first, then from localStorage
        let finalRoleId = roleId;
        if (!finalRoleId && parsedUserData.roleId) {
            finalRoleId = parsedUserData.roleId;
        }

        console.log('getUserInfo - finalRoleId:', finalRoleId);

        if (!finalRoleId) {
            console.error('No roleId found in JWT or localStorage!');
            return null;
        }

        return {
            id: userId || parsedUserData.id,
            email: parsedUserData.email,
            fullName: parsedUserData.fullName,
            roleId: finalRoleId,
            roleName: getRoleName(finalRoleId),
            ...parsedUserData
        };
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
};
