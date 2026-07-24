const express = require('express');
const app = express();

// ✅ This middleware will run for EVERY request
app.use((req, res, next) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    // Pass control to the next middleware/route handler
    next();
});

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
    res.json({ success: true, message: 'CORS works!' });
});

app.listen(8080, () => {
    console.log('🚀 Server with universal CORS running on 8080');
});