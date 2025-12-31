const jwt = require("jsonwebtoken");
const { createError } = require("../utils/createError");
const User = require("../models/User");

// Original token verification for backward compatibility
const verifyToken = (req, res, next) => {
    // Check both cookie and Authorization header
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ message: "You are not authenticated!" });
    
    jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
        if (err) {
            console.log("verifyToken - JWT error:", err.name, err.message);
            // Return 401 for expired tokens so frontend can refresh
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token has expired. Please login again." });
            }
            // Return 403 for invalid tokens
            return res.status(403).json({ message: "Token is not valid!" });
        }

        req.userId = payload.id;
        req.isSeller = payload.isSeller;
        next();
    });
}

// Original role checking for backward compatibility - now supports both old and new role systems
const checkRole = (allowedRoles) => async (req, res, next) => {
    try {
        // First, try to get role from req.isSeller (old system)
        let userRole = req.isSeller ? "seller" : "buyer";
        
        console.log('checkRole Debug:', {
            reqIsSeller: req.isSeller,
            reqUserId: req.userId,
            allowedRoles,
            initialUserRole: userRole
        });
        
        // If user data is available on the request (from enhanced middleware), use that
        if (req.user && req.user.role) {
            // Map new role system to old role names for compatibility
            if (req.user.role === 'freelancer' || req.user.isSeller) {
                userRole = 'seller';
            } else if (req.user.role === 'client') {
                userRole = 'buyer';
            } else if (req.user.role === 'admin') {
                userRole = 'admin';
            }
        } else if (req.userId) {
            // Fetch user from database to get role
            const user = await User.findById(req.userId);
            console.log('checkRole - User from DB:', {
                userId: req.userId,
                dbIsSeller: user?.isSeller,
                dbRole: user?.role
            });
            if (user) {
                if (user.role === 'freelancer' || user.isSeller) {
                    userRole = 'seller';
                } else if (user.role === 'client') {
                    userRole = 'buyer';
                } else if (user.role === 'admin') {
                    userRole = 'admin';
                }
            }
        }
        
        console.log('checkRole - Final decision:', {
            userRole,
            allowedRoles,
            hasAccess: allowedRoles.includes(userRole)
        });

        // Admin always has access
        if (userRole === 'admin') {
            return next();
        }

        // Check if the user has an allowed role
        if (!allowedRoles.includes(userRole)) {
            // Provide more specific error messages based on what role is required
            let errorMessage = "Access Denied! You do not have permission to perform this action.";
            if (allowedRoles.includes('seller') && !allowedRoles.includes('buyer')) {
                errorMessage = "This feature is only available to sellers. Please become a seller to access gig promotions.";
            }
            return res.status(403).json({ 
                success: false,
                message: errorMessage
            });
        }

        next(); // User has permission, proceed
    } catch (error) {
        console.error('checkRole error:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


// Enhanced token verification for admin features
const verifyTokenEnhanced = async (req, res, next) => {

    console.log(req.headers);
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. No token provided." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        
        // Fetch user data to get current role and permissions
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. User not found." 
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Your account has been blocked." 
            });
        }

        // Normalize role - handle both new role system and legacy isAdmin flag
        let effectiveRole = user.role || 'client';
        if (user.isAdmin === true) {
            effectiveRole = 'admin';
        }

        // Check if user is verified (except for admin)
        if (!user.isVerified && effectiveRole !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Please verify your email first." 
            });
        }

        // Attach user data to request
        req.userId = user._id;
        req.user = {
            ...user.toObject(),
            role: effectiveRole // Use normalized role
        };
        req.userRole = effectiveRole;
        req.isSeller = user.isSeller; // Backward compatibility
        req.isAdmin = effectiveRole === 'admin'; // Easy admin check
        req.permissions = user.permissions || [];

        console.log('verifyTokenEnhanced - User authenticated:', {
            userId: user._id,
            email: user.email,
            role: effectiveRole,
            isAdmin: effectiveRole === 'admin'
        });

        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. Token has expired." 
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Invalid token." 
        });
    }
};

// Updated Role hierarchy: Admin > User (Freelancer/Client)
const ROLE_HIERARCHY = {
    'admin': 3,      // Admins have highest access
    'freelancer': 2, // Freelancers are users who sell services  
    'client': 1      // Clients are users who buy services
};

// Enhanced role checking middleware
const checkRoleEnhanced = (allowedRoles, options = {}) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Authentication required." 
                });
            }

            const { 
                requireAll = false, // If true, user must have ALL specified roles
                allowHigherRoles = true, // If true, higher roles can access lower role endpoints
                checkPermissions = [] // Additional permissions to check
            } = options;

            const userRole = req.user.role;
            const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

            // Convert single role to array for consistency
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check if user has required role(s)
            let hasAccess = false;

            if (allowHigherRoles) {
                // Check if user role level is >= any of the required role levels
                const maxRequiredLevel = Math.max(...rolesArray.map(role => ROLE_HIERARCHY[role] || 0));
                hasAccess = userRoleLevel >= maxRequiredLevel;
            } else {
                // Exact role match required
                hasAccess = requireAll 
                    ? rolesArray.every(role => userRole === role)
                    : rolesArray.includes(userRole);
            }

            // Additional permission checks
            if (hasAccess && checkPermissions.length > 0) {
                hasAccess = checkPermissions.every(permission => 
                    req.user.hasPermission(permission)
                );
            }

            // Backward compatibility check for seller/buyer
            if (!hasAccess && rolesArray.includes('seller')) {
                hasAccess = req.isSeller === true;
            }
            if (!hasAccess && rolesArray.includes('buyer')) {
                hasAccess = req.isSeller === false;
            }

            if (!hasAccess) {
                console.log('Access denied for user:', {
                    userId: req.userId,
                    userRole: userRole,
                    requiredRoles: rolesArray,
                    userRoleLevel: userRoleLevel,
                    email: req.user?.email
                });
                return res.status(403).json({ 
                    success: false, 
                    message: "Access denied. Insufficient permissions.",
                    required: rolesArray,
                    current: userRole
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ 
                success: false, 
                message: "Server error during authorization." 
            });
        }
    };
};

// Admin-only middleware (highest level)
const requireAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['admin'], { allowHigherRoles: false })];

// User-level access (Freelancer or Client) - excludes admin unless specified
const requireUser = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer', 'client'])];

// Freelancer access (can be used by freelancers and admins)
const requireFreelancer = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer'])];

// Client access (can be used by clients and admins) 
const requireClient = [verifyTokenEnhanced, checkRoleEnhanced(['client'])];

// Any authenticated user (including admin)
const requireAuthenticated = [verifyTokenEnhanced, checkRoleEnhanced(['admin', 'freelancer', 'client'])];

// Legacy aliases for backward compatibility
const requireFreelancerOrAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer', 'admin'])];
const requireClientOrAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['client', 'admin'])];

// Permission-based middleware - Admins bypass permission checks
const requirePermission = (permissions) => {
    return [(req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required." 
            });
        }

        // Admins have all permissions - bypass check
        if (req.user.role === 'admin' || req.isAdmin) {
            return next();
        }

        const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
        const userPermissions = req.user.permissions || req.permissions || [];
        
        const hasPermission = permissionsArray.some(permission => 
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Required permissions not found.",
                required: permissionsArray
            });
        }

        next();
    }];
};

// Resource owner or admin middleware
const requireOwnershipOrAdmin = (resourceOwnerField = 'userId') => {
    return [verifyTokenEnhanced, (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required." 
            });
        }

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
        if (resourceOwnerId && resourceOwnerId.toString() === req.userId.toString()) {
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            message: "Access denied. You can only access your own resources." 
        });
    }];
};

// Rate limiting by role (can be enhanced with Redis later)
const rateLimitByRole = (limits = {}) => {
    const requests = new Map();
    
    // Cleanup old entries every 5 minutes to prevent memory leaks
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requests.entries()) {
            if (now - data.windowStart > 60 * 60 * 1000) { // 1 hour
                requests.delete(key);
            }
        }
    }, 5 * 60 * 1000);
    
    return (req, res, next) => {
        const userRole = req.user?.role || 'guest';
        const limit = limits[userRole] || limits.default || 1000;
        const windowMs = 15 * 60 * 1000; // 15 minutes (shorter window, resets faster)
        
        // Use userId primarily for authenticated users, fallback to IP
        const key = req.userId ? `user-${req.userId}` : `ip-${req.ip}`;
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, { count: 1, windowStart: now });
            return next();
        }
        
        const userData = requests.get(key);
        
        // Reset window if expired
        if (now - userData.windowStart > windowMs) {
            requests.set(key, { count: 1, windowStart: now });
            return next();
        }
        
        // Check limit
        if (userData.count >= limit) {
            const retryAfter = Math.ceil((windowMs - (now - userData.windowStart)) / 1000);
            res.set('Retry-After', retryAfter);
            return res.status(429).json({
                success: false,
                message: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
                limit,
                retryAfter
            });
        }
        
        userData.count++;
        next();
    };
};

module.exports = {
    // Original middleware for backward compatibility
    verifyToken,
    checkRole,
    
    // Enhanced middleware for role-based system
    verifyTokenEnhanced,
    checkRoleEnhanced,
    
    // Role-based middleware
    requireAdmin,        // Admin only
    requireUser,         // Freelancer or Client (excludes admin)
    requireFreelancer,   // Freelancer + Admin
    requireClient,       // Client + Admin  
    requireAuthenticated,// Any authenticated user
    
    // Legacy compatibility
    requireFreelancerOrAdmin,
    requireClientOrAdmin,
    
    // Utility middleware
    requirePermission,
    requireOwnershipOrAdmin,
    rateLimitByRole,
    ROLE_HIERARCHY
};