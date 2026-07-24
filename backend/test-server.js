// test-server.js - Manual CORS handler
const express = require('express');
const app = express();

// ✅ Manual CORS middleware (works with all Express versions)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // ✅ Handle preflight OPTIONS immediately
    if (req.method === 'OPTIONS') {
        console.log('📨 OPTIONS request handled with CORS');
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());

// Test login endpoint
app.post('/api/auth/login', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ CORS is working!',
        token: 'test-token-123',
        email: req.body.email,
        role: req.body.role
    });
});

// Protected test endpoint
app.get('/api/auth/me', (req, res) => {
    res.json({
        user: { email: 'teacher@test.com', role: 'Teacher' },
        message: '✅ Authenticated'
    });
});

app.listen(8080, '0.0.0.0', () => {
    console.log('🚀 Test server running on port 8080');
});