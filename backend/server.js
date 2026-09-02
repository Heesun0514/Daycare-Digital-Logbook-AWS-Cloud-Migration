// server.js (updated for Sequelize)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const cors = require('cors');
const path = require('path');
const { Attendance, Child } = require('./models'); // Import models
const { verifyToken, checkRole, loginHandler } = require('./auth');

const app = express();
const port = process.env.PORT || 8080;

// CORS
app.use(cors({
    origin: [
        'http://localhost:8080',
        'https://d2d7c2s5id6z1.cloudfront.net'
    ]
}));

app.use(express.json());

const frontendPath = path.join(__dirname, '../frontend');
console.log(`📁 Serving static files from: ${frontendPath}`);
app.use(express.static(frontendPath));

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
    
    // Check if child exists
    let child = await Child.findOne({ where: { child_name: childName } });
    
    if (child) {
        return child.parent_email;
    }
    
    // Create new child
    child = await Child.create({
        child_name: childName,
        parent_email: parentEmail
    });
    
    return child.parent_email;
}

// ============================================
// ATTENDANCE ROUTES (Sequelize)
// ============================================

// 1. CHECK-IN (CREATE)
app.post('/api/attendance/checkin', async (req, res) => {
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
app.put('/api/attendance/checkout/:id', async (req, res) => {
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
app.put('/api/attendance/:id', async (req, res) => {
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
app.get('/api/attendance/report', async (req, res) => {
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
app.post('/api/auth/login', loginHandler);

app.get('/api/auth/me', verifyToken, (req, res) => {
    res.json({
        user: req.user,
        message: '✅ Authenticated successfully'
    });
});

// ============================================
// FALLBACK FOR SPA
// ============================================
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Daycare server is live on 0.0.0.0:${port}`);
    console.log(`📍 Access the application at: http://localhost:${port}`);
});