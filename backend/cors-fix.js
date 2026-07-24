const express = require('express');
const app = express();

// ============================================
// ✅ UNIVERSAL CORS HANDLER (Works with Express 5)
// ============================================
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
    res.json({ success: true, message: 'CORS works!' });
});

app.listen(8080, () => {
    console.log('🚀 Server with universal CORS running on 8080');
});