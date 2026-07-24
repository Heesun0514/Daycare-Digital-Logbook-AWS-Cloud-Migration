const express = require('express');
const cors = require('cors');
const app = express();

console.log('✅ Starting CORS fix server...');

// ✅ CORS must be FIRST
app.use(cors());

// Middleware
app.use(express.json());

// Test login endpoint
app.post('/api/auth/login', (req, res) => {
    console.log('📨 Login request received:', req.body);
    res.json({ 
        success: true, 
        message: '✅ CORS is working!',
        token: 'test-token-123',
        email: req.body.email,
        role: req.body.role
    });
});

// Test GET endpoint
app.get('/api/auth/me', (req, res) => {
    res.json({
        user: { email: 'teacher@test.com', role: 'Teacher' },
        message: '✅ Authenticated'
    });
});

app.listen(8080, '0.0.0.0', () => {
    console.log('🚀 CORS fix server running on port 8080');
    console.log('🔗 Test with: curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test","role":"Teacher"}\'');
});