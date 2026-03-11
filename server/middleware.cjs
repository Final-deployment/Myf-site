/**
 * Authentication & Authorization Middleware
 * 
 * Provides:
 * - JWT Token verification
 * - Role-based access control (admin, supervisor, student)
 * - Optional authentication for mixed-access routes
 * 
 * @module server/middleware
 */

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.error('[FATAL] SECRET_KEY environment variable is not set! Server cannot start securely.');
    process.exit(1);
}

/**
 * Authenticate JWT Token (Required)
 * Returns 401 if no token, 403 if invalid token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access denied. No token provided.',
            code: 'AUTH_NO_TOKEN'
        });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('[Auth Middleware] Invalid token:', err.message);
            return res.status(403).json({
                error: 'Invalid or expired token.',
                code: 'AUTH_INVALID_TOKEN'
            });
        }
        req.user = user;
        next();
    });
};

/**
 * Optional Authentication
 * Attaches user to req if token is valid, but doesn't block if missing
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

/**
 * Require Admin Role
 * Must be used AFTER authenticateToken
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
    }

    if (req.user.role !== 'admin') {
        console.warn(`[Auth] Non-admin user ${req.user.id} attempted admin action: ${req.method} ${req.path}`);
        return res.status(403).json({
            error: 'Admin access required.',
            code: 'ADMIN_REQUIRED'
        });
    }

    next();
};

/**
 * Require Admin or Supervisor Role
 * Must be used AFTER authenticateToken
 */
const requireAdminOrSupervisor = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        console.warn(`[Auth] Unauthorized role ${req.user.role} attempted privileged action: ${req.method} ${req.path}`);
        return res.status(403).json({
            error: 'Admin or Supervisor access required.',
            code: 'PRIVILEGED_ACCESS_REQUIRED'
        });
    }

    next();
};

/**
 * Require ownership or admin access
 * Checks if req.user.id matches req.params.id OR user is admin
 * Must be used AFTER authenticateToken
 */
const requireOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required.',
            code: 'AUTH_REQUIRED'
        });
    }

    const targetId = req.params.id || req.params.userId;

    if (req.user.role === 'admin' || req.user.id === targetId) {
        return next();
    }

    console.warn(`[Auth] User ${req.user.id} attempted to access resource of user ${targetId}`);
    return res.status(403).json({
        error: 'Access denied. You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
    });
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    requireAdminOrSupervisor,
    requireOwnerOrAdmin
};
