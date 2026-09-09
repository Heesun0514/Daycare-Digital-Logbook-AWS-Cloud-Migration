// backend/auth.js
const jwt = require('jsonwebtoken');
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");


// ============================================
// CONFIGURATION
// ============================================

const JWT_SECRET = process.env.JWT_SECRET;
const COGNITO_REGION = process.env.COGNITO_REGION || 'eu-west-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;




if (!JWT_SECRET || !COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    console.error('❌ Missing required Cognito environment variables');
    console.error('Required: JWT_SECRET, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID');
}

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

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

const loginHandler = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Step 1: Authenticate with Cognito
        const params = {
            ClientId: COGNITO_CLIENT_ID,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };
const command = new InitiateAuthCommand(params);
        const response = await cognitoClient.send(command);

        if (!response.AuthenticationResult) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        // Step 2: Extract tokens from Cognito response
        const { IdToken, AccessToken } = response.AuthenticationResult;

        // Step 3: Decode the IdToken to get user info and role
        const decodedIdToken = jwt.decode(IdToken);
        
        if (!decodedIdToken) {
            return res.status(500).json({ error: 'Failed to decode token' });
        }

        // Step 4: Extract role from custom attribute or group
        // Cognito stores custom attributes as "custom:role" or in groups
        const role = decodedIdToken['custom:role'] || decodedIdToken.role || 'Teacher';

        // Step 5: Validate role
    if (!['Teacher', 'Director'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

       // Step 6: Generate JWT with 5-minute expiry
    const token = jwt.sign(
        { 
            email, 
            role,
            sub: decodedIdToken.sub,
            exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
        },
        JWT_SECRET
    );

    res.json({
        success: true,
        token: token,
        idToken: IdToken,
        accessToken: AccessToken,
        email,
        role,
        message: '✅ Login successful'
    });
} catch (error) {
        console.error('Cognito login error:', error.message);
        
        if (error.name === 'UserNotFoundException') {
            return res.status(401).json({ error: 'User not found' });
        }
        
        if (error.name === 'NotAuthorizedException') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        return res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
};


// ============================================
// EXPORT MODULES
// ============================================

module.exports = {
    verifyToken,
    checkRole,
    loginHandler
};
