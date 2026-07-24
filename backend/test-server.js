const express = require('express');
const app = express();

console.log('✅ Starting CORS test server...');

// CORS middleware - FIRST THING
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS request handled!');
        return res.status(200).send('OK');
    }
    next();
});

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
    res.json({ success: true, message: 'CORS is working!' });
});

app.listen(8080, () => {
    console.log('🚀 Server running on port 8080');
    console.log('🔗 Test CORS with: curl -v -X OPTIONS http://localhost:8080/api/auth/login -H "Origin: http://127.0.0.1:5500"');
});