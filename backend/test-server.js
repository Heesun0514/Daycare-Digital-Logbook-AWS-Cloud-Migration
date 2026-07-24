// test-server.js - Manual CORS handler
const express = require('express');
const app = express();

// ✅ Manual CORS middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`); // ← Debugging
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS handled with CORS');
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

app.listen(8080, '0.0.0.0', () => {
    console.log('🚀 Test server running on port 8080');
});