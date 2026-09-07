// backend/auth.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ============================================
// CONFIGURATION
// ============================================

const VALID_ROLES = ['Teacher', 'Director'];

function getJwtSecret() {
    return process.env.JWT_SECRET;
}

function logAuthEvent(level, event, req, details = {}) {
    const logMethod = console[level] || console.log;
    logMethod(`[AUTH] ${JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl || req.url,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        ...details
    })}`);
}

function secureCompare(left, right) {
    const leftBuffer = Buffer.from(String(left));
    const rightBuffer = Buffer.from(String(right));

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getConfiguredUsers() {
    const rawUsers = process.env.AUTH_USERS_JSON;

    if (!rawUsers) {
        return null;
    }

    try {
        const parsedUsers = JSON.parse(rawUsers);
        const users = Array.isArray(parsedUsers) ? parsedUsers : Object.values(parsedUsers);

        return users
            .filter((user) => user && user.email && user.password && VALID_ROLES.includes(user.role))
            .map((user) => ({
                email: String(user.email).trim().toLowerCase(),
                password: String(user.password),
                role: user.role
            }));
    } catch (error) {
        return null;
    }
}

// ============================================
// JWT VERIFICATION MIDDLEWARE
// ============================================

/**
 * Middleware to verify JWT token from Authorization header
 * Tokens are stored in memory only (stateless)
 */
const verifyToken = (req, res, next) => {
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
        logAuthEvent('error', 'auth.misconfigured', req, { reason: 'JWT_SECRET is not set' });
        return res.status(500).json({ error: 'Authentication is not configured' });
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logAuthEvent('warn', 'token.missing', req);
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // Attach user info to request
        logAuthEvent('info', 'token.verified', req, {
            email: decoded.email,
            role: decoded.role
        });
        next();
    } catch (err) {
        logAuthEvent('warn', 'token.invalid', req, { reason: err.message });
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to check if user has required role
 */
const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!requiredRoles.includes(req.user.role)) {
            logAuthEvent('warn', 'role.denied', req, {
                email: req.user.email,
                role: req.user.role,
                requiredRoles
            });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// ============================================
// LOGIN ENDPOINT (Simplified for Testing)
// ============================================

const loginHandler = (req, res) => {
    const jwtSecret = getJwtSecret();
    const configuredUsers = getConfiguredUsers();
    const { email, password, role } = req.body;

    if (!jwtSecret) {
        logAuthEvent('error', 'auth.misconfigured', req, { reason: 'JWT_SECRET is not set' });
        return res.status(500).json({ error: 'Authentication is not configured' });
    }

    if (!configuredUsers || configuredUsers.length === 0) {
        logAuthEvent('error', 'auth.misconfigured', req, { reason: 'AUTH_USERS_JSON is missing or invalid' });
        return res.status(500).json({ error: 'Authentication users are not configured' });
    }

    if (!email || !password) {
        logAuthEvent('warn', 'login.invalid_request', req, { email });
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const matchedUser = configuredUsers.find((user) => user.email === normalizedEmail);

    if (!matchedUser || !secureCompare(password, matchedUser.password)) {
        logAuthEvent('warn', 'login.failed', req, { email: normalizedEmail });
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (role && role !== matchedUser.role) {
        logAuthEvent('warn', 'login.role_mismatch', req, {
            email: normalizedEmail,
            requestedRole: role,
            actualRole: matchedUser.role
        });
        return res.status(403).json({ error: 'Role does not match account' });
    }

    const token = jwt.sign(
        { 
            email: matchedUser.email,
            role: matchedUser.role
        },
        jwtSecret,
        { expiresIn: '5m' }
    );

    logAuthEvent('info', 'login.success', req, {
        email: matchedUser.email,
        role: matchedUser.role
    });

    res.json({
        success: true,
        token,
        email: matchedUser.email,
        role: matchedUser.role,
        message: '✅ Login successful'
    });
};

// ============================================
// EXPORT MODULES
// ============================================

module.exports = {
    verifyToken,
    checkRole,
    loginHandler
};
