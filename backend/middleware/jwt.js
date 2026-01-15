const jwt = require("jsonwebtoken");
const { createError } = require("../utils/createError");
const User = require("../models/User");

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
    
    if (!token) return res.status(401).json({ message: "You are not authenticated!" });
    
    jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token has expired. Please login again." });
            }
            return res.status(403).json({ message: "Token is not valid!" });
        }

        req.userId = payload.id;
        req.userRole = payload.role;
        req.isSeller = payload.isSeller;
        req.isAdmin = payload.role === 'admin';
        next();
    });
}

const checkRole = (allowedRoles) => async (req, res, next) => {
    try {
        const normalizeLegacyRole = (role) => {
            const r = String(role || '').toLowerCase();
            if (!r) return r;
            if (r === 'freelancer') return 'seller';
            if (r === 'client') return 'buyer';
            return r;
        };

        let userRole = normalizeLegacyRole(req.userRole || (req.isSeller ? "seller" : "buyer"));
        
        if (req.user && req.user.role) {
            const reqUserRole = normalizeLegacyRole(req.user.role);
            if (reqUserRole === 'seller' || req.user.isSeller) {
                userRole = 'seller';
            } else if (reqUserRole === 'buyer') {
                userRole = 'buyer';
            } else if (reqUserRole === 'admin') {
                userRole = 'admin';
            }
        } else if (req.userId) {
            const user = await User.findById(req.userId);
            if (user) {
                const dbRole = normalizeLegacyRole(user.role);
                if (dbRole === 'seller' || user.isSeller) {
                    userRole = 'seller';
                } else if (dbRole === 'buyer') {
                    userRole = 'buyer';
                } else if (dbRole === 'admin') {
                    userRole = 'admin';
                }
            }
        }
        
        if (userRole === 'admin') {
            return next();
        }

        const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(normalizeLegacyRole);
        if (!allowed.includes(userRole)) {
            let errorMessage = "Access Denied! You do not have permission to perform this action.";
            if (allowed.includes('seller') && !allowed.includes('buyer')) {
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

const verifyTokenEnhanced = async (req, res, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. No token provided." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. User not found." 
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Your account has been blocked." 
            });
        }

        let effectiveRole = (user.role || 'client').toLowerCase();
        if (user.isAdmin === true) {
            effectiveRole = 'admin';
        }

        if (!user.isVerified && effectiveRole !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Please verify your email first." 
            });
        }

        req.userId = user._id;
        req.user = {
            ...user.toObject(),
            role: effectiveRole // Use normalized role
        };
        req.userRole = effectiveRole;
        req.isSeller = user.isSeller; // Backward compatibility
        req.isAdmin = effectiveRole === 'admin'; // Easy admin check
        req.permissions = user.permissions || [];

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

const ROLE_HIERARCHY = {
    'admin': 3,      // Admins have highest access
    'freelancer': 2, // Freelancers are users who sell services  
    'client': 1      // Clients are users who buy services
};

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

            const userRole = req.user.role?.toLowerCase();
            const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

            const rolesArray = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => r.toLowerCase());

            let hasAccess = false;

            if (allowHigherRoles) {
                const maxRequiredLevel = Math.max(...rolesArray.map(role => ROLE_HIERARCHY[role] || 0));
                hasAccess = userRoleLevel >= maxRequiredLevel;
            } else {
                hasAccess = requireAll 
                    ? rolesArray.every(role => userRole === role)
                    : rolesArray.includes(userRole);
            }

            if (hasAccess && checkPermissions.length > 0) {
                const userPermissions = req.user.permissions || [];
                hasAccess = checkPermissions.every(permission => 
                    userPermissions.includes(permission)
                );
            }

            if (!hasAccess && rolesArray.includes('seller')) {
                hasAccess = req.isSeller === true;
            }
            if (!hasAccess && rolesArray.includes('buyer')) {
                hasAccess = req.isSeller === false;
            }

            if (!hasAccess) {
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

const requireAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['admin'], { allowHigherRoles: false })];

const requireUser = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer', 'client'])];

const requireFreelancer = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer'])];

const requireClient = [verifyTokenEnhanced, checkRoleEnhanced(['client'])];

const requireAuthenticated = [verifyTokenEnhanced, checkRoleEnhanced(['admin', 'freelancer', 'client'])];

const requireFreelancerOrAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['freelancer', 'admin'])];
const requireClientOrAdmin = [verifyTokenEnhanced, checkRoleEnhanced(['client', 'admin'])];

const requirePermission = (permissions) => {
    return [(req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required." 
            });
        }

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

const requireOwnershipOrAdmin = (resourceOwnerField = 'userId') => {
    return [verifyTokenEnhanced, (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required." 
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

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

const rateLimitByRole = (limits = {}) => {
    const requests = new Map();
    
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
        
        const key = req.userId ? `user-${req.userId}` : `ip-${req.ip}`;
        const now = Date.now();
        
        if (!requests.has(key)) {
            requests.set(key, { count: 1, windowStart: now });
            return next();
        }
        
        const userData = requests.get(key);
        
        if (now - userData.windowStart > windowMs) {
            requests.set(key, { count: 1, windowStart: now });
            return next();
        }
        
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
    verifyToken,
    checkRole,
    
    verifyTokenEnhanced,
    checkRoleEnhanced,
    
    requireAdmin,        // Admin only
    requireUser,         // Freelancer or Client (excludes admin)
    requireFreelancer,   // Freelancer + Admin
    requireClient,       // Client + Admin  
    requireAuthenticated,// Any authenticated user
    
    requireFreelancerOrAdmin,
    requireClientOrAdmin,
    
    requirePermission,
    requireOwnershipOrAdmin,
    rateLimitByRole,
    ROLE_HIERARCHY
};