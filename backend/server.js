// server.js - Full Sequelize Version with EB Fixes
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Attendance, Child, sequelize } = require('./models');
const { initializeDatabase } = require('./database');
const { verifyToken, checkRole, loginHandler } = require('./auth');

const app = express();
const port = process.env.PORT || 8080;
const attendanceAccessRoles = ['Teacher', 'Director'];
const authRateLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const authRateLimitMaxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 30);
const authRateLimiter = rateLimit({
    windowMs: authRateLimitWindowMs,
    limit: authRateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' }
});

// CORS
app.use(cors({
    origin: [
        'http://localhost:8080',
        'https://d2d7c2s58id62i.cloudfront.net',
        'http://daycare-frontend-huiseon.s3-website-eu-west-1.amazonaws.com',
        'https://daycare-frontend-huiseon.s3.eu-west-1.amazonaws.com', 
    ],
     credentials: true
}));

app.use(express.json());

// Serve static files from frontend if it exists
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
    console.log(`📁 Serving static files from: ${frontendPath}`);
    app.use(express.static(frontendPath));
} else {
    console.log(`⚠️  Frontend directory not found at: ${frontendPath}`);
    console.log(`📝 Using CloudFront for frontend delivery`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateParentEmail(childName) {
    const sanitized = childName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
    return `${sanitized}@daycare.local`;
}

async function getOrCreateParentEmail(childName) {
    const parentEmail = generateParentEmail(childName);
    let child = await Child.findOne({ where: { child_name: childName } });
    if (child) {
        return child.parent_email;
    }
    child = await Child.create({
        child_name: childName,
        parent_email: parentEmail
    });
    return child.parent_email;
}

// ============================================
// ATTENDANCE ROUTES
// ============================================

// 1. CHECK-IN (CREATE)
app.post('/api/attendance/checkin', authRateLimiter, verifyToken, checkRole(attendanceAccessRoles), async (req, res) => {
    try {
        const { child_name, arrival_time, date } = req.body;
        if (!child_name || !arrival_time || !date) {
            return res.status(400).json({ error: 'child_name, arrival_time, date are required' });
        }
        const parentEmail = await getOrCreateParentEmail(child_name);
        const record = await Attendance.create({
            child_name,
            parent_email: parentEmail,
            arrival_time,
            date
        });
        res.status(201).json({
            id: record.id,
            child_name: record.child_name,
            parent_email: record.parent_email,
            arrival_time: record.arrival_time,
            date: record.date,
            message: '✅ Check-in successful'
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. CHECK-OUT (UPDATE)
app.put('/api/attendance/checkout/:id', authRateLimiter, verifyToken, checkRole(attendanceAccessRoles), async (req, res) => {
    try {
        const { id } = req.params;
        const { departure_time } = req.body;
        if (!departure_time) {
            return res.status(400).json({ error: 'departure_time is required' });
        }
        const record = await Attendance.findByPk(id);
        if (!record) {
            return res.status(404).json({ error: `Attendance record with id ${id} not found` });
        }
        if (record.departure_time) {
            return res.status(400).json({ error: `Already checked out at ${record.departure_time}` });
        }
        record.departure_time = departure_time;
        await record.save();
        res.status(200).json({
            success: true,
            message: '✅ Check-out successful',
            record: record
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. EDIT ATTENDANCE (UPDATE)
app.put('/api/attendance/:id', authRateLimiter, verifyToken, checkRole(attendanceAccessRoles), async (req, res) => {
    try {
        const { id } = req.params;
        const { arrival_time, departure_time, date } = req.body;
        if (!arrival_time && !departure_time && !date) {
            return res.status(400).json({ error: 'At least one field is required' });
        }
        const record = await Attendance.findByPk(id);
        if (!record) {
            return res.status(404).json({ error: `Attendance record with id ${id} not found` });
        }
        if (arrival_time !== undefined) record.arrival_time = arrival_time;
        if (departure_time !== undefined) record.departure_time = departure_time;
        if (date !== undefined) record.date = date;
        await record.save();
        res.status(200).json({
            success: true,
            message: '✅ Attendance record updated successfully',
            record: record
        });
    } catch (error) {
        console.error('Edit error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. GENERATE REPORT (READ)
app.get('/api/attendance/report', authRateLimiter, verifyToken, checkRole(attendanceAccessRoles), async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'Both "from" and "to" dates are required' });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(from) || !dateRegex.test(to)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        const records = await Attendance.findAll({
            where: {
                date: {
                    [Op.between]: [from, to]
                }
            },
            order: [
                ['date', 'ASC'],
                ['child_name', 'ASC']
            ]
        });
        if (records.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No attendance records found from ${from} to ${to}`,
                record: []
            });
        }
        res.status(200).json({
            success: true,
            message: `✅ Report generated for ${from} to ${to}`,
            record: records
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/login', authRateLimiter, loginHandler);

app.get('/api/auth/me', authRateLimiter, verifyToken, (req, res) => {
    res.json({
        user: req.user,
        message: '✅ Authenticated successfully'
    });
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({ status: '✅ Healthy', database: 'Connected' });
    } catch (error) {
        res.status(503).json({ status: '⚠️  Degraded', database: 'Disconnected', error: error.message });
    }
});

// ============================================
// FALLBACK FOR SPA
// ============================================
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    if (fs.existsSync(frontendPath)) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'Frontend not found. Use CloudFront URL for frontend.' });
    }
});

// ============================================
// START SERVER
// ============================================
async function startServer() {
    return app.listen(port, '0.0.0.0', async () => {
        console.log(`🚀 Daycare server is live on 0.0.0.0:${port}`);
        console.log(`📍 Access the application at: http://localhost:${port}`);
        
        // Initialize database asynchronously
        const dbConnected = await initializeDatabase();
        if (dbConnected) {
            console.log(`✅ Server is fully operational`);
        } else {
            console.log(`⚠️  Server started but database is not connected. Check environment variables.`);
        }
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
