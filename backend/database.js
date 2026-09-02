// database.js - Conditional: SQLite (local) or PostgreSQL (production)
const path = require('path');
const fs = require('fs');

// Check if we're on Elastic Beanstalk (production) or local
const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST !== undefined;

if (isProduction) {
    // ✅ Use PostgreSQL with Sequelize
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(
        process.env.DB_NAME || 'daycare_db',
        process.env.DB_USER || 'daycareadmin',
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );

    sequelize.authenticate()
        .then(() => {
            console.log('✅ Connected to PostgreSQL RDS successfully!');
            console.log(`📡 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
            console.log(`📁 Database: ${process.env.DB_NAME}`);
        })
        .catch(err => {
            console.error('❌ Unable to connect to PostgreSQL:', err.message);
            process.exit(1);
        });

    module.exports = sequelize;
} else {
    // ✅ Use SQLite (original code for local development)
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'database.db');
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
}