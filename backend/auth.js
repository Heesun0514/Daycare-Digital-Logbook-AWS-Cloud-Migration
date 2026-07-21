// backend/auth.js
const jwt = require('jsonwebtoken');

// ============================================
// CONFIGURATION
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'daycare-secret-key';

// ============================================
// JWT VERIFICATION MIDDLEWARE
// ============================================

/**
 * Middleware to verify JWT token from Authorization header
 * Tokens are stored in memory only (stateless)
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify JWT using our secret
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
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
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// ============================================
// LOGIN ENDPOINT (Simplified for Testing)
// ============================================

const loginHandler = (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ error: 'Email and role are required' });
    }

    // For testing, accept any email with Teacher or Director role
    // In production, this would validate against Cognito
    if (!['Teacher', 'Director'].includes(role)) {
        return res.status(400).json({ error: 'Role must be Teacher or Director' });
    }

    // Generate JWT token (expires in 5 minutes)
    const token = jwt.sign(
        { 
            email, 
            role,
            exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
        },
        JWT_SECRET
    );

    res.json({
        success: true,
        token,
        email,
        role,
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
