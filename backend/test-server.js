// test-server.js - Minimal working server with CORS
const express = require('express');
const cors = require('cors');
const app = express();

// ✅ Use cors package
app.use(cors());

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