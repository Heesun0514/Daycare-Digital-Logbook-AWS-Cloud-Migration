// database.js - Always use SQLite
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Use /tmp on Elastic Beanstalk (writable), or local folder
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/database.db' 
    : path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database opening error:', err.message);
    else console.log(`Connected to SQLite database at: ${dbPath}`);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_name TEXT NOT NULL,
        parent_email TEXT,
        arrival_time TEXT,
        departure_time TEXT,
        date TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_name TEXT NOT NULL UNIQUE,
        parent_email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = db;