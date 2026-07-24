require('dotenv').config();

const express = require("express");
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { verifyToken, checkRole, loginHandler } = require('./auth');

const app = express();
const port = process.env.PORT || 8080;


// ✅ CORS must be the FIRST middleware
app.use(cors());


// Middleware
app.use(express.json());

// Serve frontend static files
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

function getOrCreateParentEmail(childName, callback) {
    const parentEmail = generateParentEmail(childName);
    db.get(
        `SELECT parent_email FROM children WHERE child_name = ?`,
        [childName],
        (err, row) => {
            if (err) return callback(err, null);
            if (row) return callback(null, row.parent_email);
            db.run(
                `INSERT INTO children (child_name, parent_email) VALUES (?, ?)`,
                [childName, parentEmail],
                function(err) {
                    if (err) return callback(null, parentEmail);
                    callback(null, parentEmail);
                }
            );
        }
    );
}

// ============================================
// ATTENDANCE ROUTES (YOUR EXISTING ROUTES)
// ============================================
app.post('/api/attendance/checkin', (req, res) => {
    const { child_name, arrival_time, date } = req.body;
    if (!child_name || !arrival_time || !date) {
        return res.status(400).json({ error: 'child_name, arrival_time, date are required' });
    }
    getOrCreateParentEmail(child_name, (err, parentEmail) => {
        if (err) return res.status(500).json({ error: err.message });
        const sql = `INSERT INTO attendance(child_name, parent_email, arrival_time, date) VALUES (?, ?, ?, ?)`;
        db.run(sql, [child_name, parentEmail, arrival_time, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id: this.lastID,
                child_name,
                parent_email: parentEmail,
                arrival_time,
                date,
                message: '✅ Check-in successful'
            });
        });
    });
});

app.put('/api/attendance/checkout/:id', (req, res) => {
    const { id } = req.params;
    const { departure_time } = req.body;
    if (!departure_time) {
        return res.status(400).json({ error: 'departure_time is required (format: HH:MM)' });
    }
    const checksql = `SELECT * FROM attendance WHERE id = ?`;
    db.get(checksql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: `Attendance record with id ${id} not found` });
        if (row.departure_time) {
            return res.status(400).json({ error: `Already checked out at ${row.departure_time}` });
        }
        const updatesql = `UPDATE attendance SET departure_time = ? WHERE id = ?`;
        db.run(updatesql, [departure_time, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get(`SELECT * FROM attendance WHERE id = ?`, [id], (err, updatedRow) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({
                    success: true,
                    message: '✅ Check-out successful',
                    record: updatedRow
                });
            });
        });
    });
});

app.put('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    const { arrival_time, departure_time, date } = req.body;
    if (!arrival_time && !departure_time && !date) {
        return res.status(400).json({ error: 'At least one field is required' });
    }
    const checksql = `SELECT * FROM attendance WHERE id = ?`;
    db.get(checksql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: `Attendance record with id ${id} not found` });
        let updateFields = [];
        let updateValues = [];
        if (arrival_time !== undefined) {
            updateFields.push('arrival_time = ?');
            updateValues.push(arrival_time);
        }
        if (departure_time !== undefined) {
            updateFields.push('departure_time = ?');
            updateValues.push(departure_time);
        }
        if (date !== undefined) {
            updateFields.push('date = ?');
            updateValues.push(date);
        }
        updateValues.push(id);
        const updatesql = `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`;
        db.run(updatesql, updateValues, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get(`SELECT * FROM attendance WHERE id = ?`, [id], (err, updatedRow) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({
                    success: true,
                    message: '✅ Attendance record updated successfully',
                    record: updatedRow
                });
            });
        });
    });
});

app.get('/api/attendance/report', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: 'Both "from" and "to" dates are required' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    const sql = `SELECT * FROM attendance WHERE date BETWEEN ? AND ? ORDER BY date ASC, child_name ASC`;
    db.all(sql, [from, to], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No attendance records found from ${from} to ${to}`,
                record: []
            });
        }
        res.status(200).json({
            success: true,
            message: `✅ Report generated for ${from} to ${to}`,
            record: rows
        });
    });
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
// FALLBACK FOR SPA (must be AFTER all API routes)
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