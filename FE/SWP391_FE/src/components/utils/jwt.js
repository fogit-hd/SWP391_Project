/**
 * JWT Utility Functions
 * 
 * This module provides utilities for working with JWT tokens,
 * including decoding and extracting user information.
 * 
 * ROLE MAPPING:
 * - Role 1: Admin (Full access to all features)
 * - Role 2: Staff (Access to staff dashboard and contract review + CoOwner pages)
 * - Role 3: CoOwner (Access to co-ownership features only)
 * - Role 4: Technician (Access to technician dashboard and service review + CoOwner pages)
 */

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
    try {
        if (!token) {
            console.warn('[JWT] No token provided to decode');
            return null;
        }

        // Remove quotes if present
        const cleanToken = token.replace(/"/g, '');

        // Split token into parts
        const parts = cleanToken.split('.');
        if (parts.length !== 3) {
            console.error('[JWT] Invalid token format - expected 3 parts, got:', parts.length);
            return null;
        }

        // Decode payload (second part)
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const decodedObj = JSON.parse(decoded);

        // Log ALL fields in JWT payload to help identify the correct field names
        console.log('[JWT] Full JWT payload (all fields):', decodedObj);
        console.log('[JWT] Token decoded successfully:', {
            id: decodedObj.id,
            sub: decodedObj.sub,
            role: decodedObj.role,
            email: decodedObj.email,
            exp: decodedObj.exp
        });

        return decodedObj;
    } catch (error) {
        console.error('[JWT] Error decoding JWT:', error);
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
    if (!decoded) {
        console.warn('[JWT] Could not decode token to extract roleId');
        return null;
    }

    // Get role from JWT - try multiple field names
    const role = decoded.roleId || decoded.role || decoded.role_id;
    console.log('[JWT] Raw role value from token:', role, '(type:', typeof role, ')');

    // Convert string role to numeric roleId
    // Note: JavaScript converts numeric keys to strings, so we only need string keys
    const roleMapping = {
        'Admin': 1,
        'Staff': 2,
        'CoOwner': 3,
        'Technician': 4,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
    };

    const mappedRoleId = roleMapping[role];
    console.log('[JWT] getRoleIdFromToken - role:', role, '-> mappedRoleId:', mappedRoleId);

    return mappedRoleId || null;
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded) return null;

    // Backend uses 'id' field in JWT payload
    const userId = decoded.id;

    if (userId) {
        console.log('[JWT] getUserIdFromToken - userId:', userId);
    } else {
        console.warn('[JWT] getUserIdFromToken - No id field found in token! Available fields:', Object.keys(decoded));
    }

    return userId || null;
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
        console.warn('[JWT] No expiration time in token');
        return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < currentTime;

    console.log('[JWT] Token expiration check:', {
        exp: decoded.exp,
        currentTime: currentTime,
        isExpired: isExpired
    });

    return isExpired;
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
        4: 'Technician',
        'Admin': 'Admin',
        'Staff': 'Staff',
        'CoOwner': 'CoOwner',
        'Technician': 'Technician',
    };

    const roleName = roleMap[roleId] || 'Unknown';
    console.log('[JWT] getRoleName - roleId:', roleId, '-> roleName:', roleName);

    return roleName;
};

/**
 * Check if user has required role
 * 
 * ROLE HIERARCHY & PERMISSIONS:
 * - Admin (1): Can access EVERYTHING
 * - Staff (2): Can access Staff (2) pages and CoOwner (3) pages
 * - CoOwner (3): Can access CoOwner (3) pages only
 * - Technician (4): Can access Technician (4) pages and CoOwner (3) pages
 * 
 * @param {number} userRoleId - User's role ID
 * @param {number} requiredRoleId - Required role ID
 * @returns {boolean} - True if user has required role
 */
export const hasRole = (userRoleId, requiredRoleId) => {
    console.log('[RBAC] hasRole check:', {
        userRoleId,
        userRole: getRoleName(userRoleId),
        requiredRoleId,
        requiredRole: getRoleName(requiredRoleId)
    });

    if (!userRoleId || !requiredRoleId) {
        console.warn('[RBAC] Missing roleId - userRoleId:', userRoleId, 'requiredRoleId:', requiredRoleId);
        return false;
    }

    // Convert to numbers in case they're strings
    const numUserRoleId = Number(userRoleId);
    const numRequiredRoleId = Number(requiredRoleId);

    // Admin (1) has access to everything
    if (numUserRoleId === 1) {
        console.log('[RBAC] ✓ Admin has access to everything');
        return true;
    }

    // Staff (2) has access to Staff (2) and CoOwner (3) pages
    if (numUserRoleId === 2) {
        const hasAccess = numRequiredRoleId === 2 || numRequiredRoleId === 3;
        console.log('[RBAC]', hasAccess ? '✓' : '✗', `Staff (2) ${hasAccess ? 'can' : 'cannot'} access role ${numRequiredRoleId}`);
        return hasAccess;
    }

    // CoOwner (3) only has access to CoOwner (3) pages
    if (numUserRoleId === 3) {
        const hasAccess = numRequiredRoleId === 3;
        console.log('[RBAC]', hasAccess ? '✓' : '✗', `CoOwner (3) ${hasAccess ? 'can' : 'cannot'} access role ${numRequiredRoleId}`);
        return hasAccess;
    }

    // Technician (4) has access to Technician (4) and CoOwner (3) pages
    if (numUserRoleId === 4) {
        const hasAccess = numRequiredRoleId === 4 || numRequiredRoleId === 3;
        console.log('[RBAC]', hasAccess ? '✓' : '✗', `Technician (4) ${hasAccess ? 'can' : 'cannot'} access role ${numRequiredRoleId}`);
        return hasAccess;
    }

    console.error('[RBAC] Unknown role:', numUserRoleId);
    return false;
};

/**
 * Get user info from token and localStorage
 * @returns {object|null} - User info or null
 */
export const getUserInfo = () => {
    try {
        console.log('\n[AUTH] === getUserInfo START ===');

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        console.log('[AUTH] localStorage check:', {
            token: !!token,
            userData: !!userData
        });

        if (!token) {
            console.log('[AUTH] No token found in localStorage');
            return null;
        }

        // Try to get roleId from JWT first
        const roleId = getRoleIdFromToken(token);
        const userId = getUserIdFromToken(token);

        console.log('[AUTH] Extracted from JWT:', {
            roleId,
            role: getRoleName(roleId),
            userId
        });

        // If we have userData in localStorage, use it as fallback
        let parsedUserData = {};
        if (userData) {
            try {
                parsedUserData = JSON.parse(userData);
                console.log('[AUTH] Parsed localStorage userData:', {
                    role: parsedUserData.role
                });
            } catch (error) {
                console.error('[AUTH] Error parsing userData:', error);
            }
        }

        // Use roleId from JWT first, then from localStorage
        let finalRoleId = roleId;
        if (!finalRoleId && parsedUserData.roleId) {
            console.log('[AUTH] Using roleId from localStorage since JWT roleId is missing');
            finalRoleId = parsedUserData.roleId;
        }

        console.log('[AUTH] Final roleId:', finalRoleId, '(' + getRoleName(finalRoleId) + ')');

        if (!finalRoleId) {
            console.error('[AUTH] ✗ No roleId found in JWT or localStorage!');
            return null;
        }

        const userInfo = {
            id: userId || parsedUserData.id,
            roleId: finalRoleId,
            roleName: getRoleName(finalRoleId),
            ...parsedUserData
        };

        console.log('[AUTH] ✓ User info successfully created:', {
            id: userInfo.id,
            roleId: userInfo.roleId,
            roleName: userInfo.roleName
        });

        console.log('[AUTH] === getUserInfo END ===\n');

        return userInfo;
    } catch (error) {
        console.error('[AUTH] Error getting user info:', error);
        console.log('[AUTH] === getUserInfo END (ERROR) ===\n');
        return null;
    }
};
