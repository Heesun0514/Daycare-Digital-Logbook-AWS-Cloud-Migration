/**
 * Database Migration Script: SQLite → PostgreSQL (RDS)
 * 
 * Converts data from SQLite to PostgreSQL while preserving data integrity
 */

// ============================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ============================================
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

// PostgreSQL RDS Configuration - Reads from .env
const PG_CONFIG = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'daycare_db',
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false // Set to true for debugging
};

// SQLite Database Path
let SQLITE_PATH = process.env.SQLITE_DB_PATH || './daycare.db';
const CSV_OUTPUT_DIR = path.join(__dirname, 'migrations', 'data');

// ============================================
// POSTGRESQL MODELS (Matching SQLite Schema)
// ============================================

const Attendance = (sequelize) => sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false
    },
    child_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    parent_email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    arrival_time: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    departure_time: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    date: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'attendances',
    timestamps: false
});

const Child = (sequelize) => sequelize.define('Child', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false
    },
    child_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    parent_email: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'children',
    timestamps: false
});

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

async function migrate() {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...');
    console.log(`📡 Target: ${PG_CONFIG.host}:${PG_CONFIG.port}`);

    // Create output directory
    if (!fs.existsSync(CSV_OUTPUT_DIR)) {
        fs.mkdirSync(CSV_OUTPUT_DIR, { recursive: true });
    }

    let pgSequelize = null;

    try {
        // --- Step 1: Connect to PostgreSQL ---
        console.log('🔄 Connecting to PostgreSQL...');
        pgSequelize = new Sequelize(PG_CONFIG.database, PG_CONFIG.username, PG_CONFIG.password, {
            host: PG_CONFIG.host,
            port: PG_CONFIG.port,
            dialect: PG_CONFIG.dialect,
            dialectOptions: PG_CONFIG.dialectOptions,
            logging: PG_CONFIG.logging
        });

        await pgSequelize.authenticate();
        console.log('✅ Connected to PostgreSQL successfully!');

        // --- Step 2: Check if SQLite file exists ---
        let sqliteAbsolutePath = path.resolve(SQLITE_PATH);
        if (!fs.existsSync(sqliteAbsolutePath)) {
            console.warn(`⚠️ SQLite file not found at: ${sqliteAbsolutePath}`);
            // Try alternative location in the same folder
            const altPath = path.join(__dirname, 'daycare.db');
            if (fs.existsSync(altPath)) {
                console.log(`✅ Found SQLite at: ${altPath}`);
                sqliteAbsolutePath = altPath;
            } else {
                console.error('❌ SQLite database not found. Please provide the correct path.');
                process.exit(1);
            }
        }

        // --- Step 3: Export SQLite to CSV ---
        console.log('📤 Exporting data from SQLite...');
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(sqliteAbsolutePath);

        // Export Attendance table (use correct table name)
        await exportTableToCSV(db, 'attendances', 'attendance.csv');
        // Export Children table
        await exportTableToCSV(db, 'children', 'children.csv');
        
        db.close();
        console.log('✅ SQLite data exported to CSV successfully!');

        // --- Step 4: Import CSV to PostgreSQL ---
        console.log('📥 Importing data to PostgreSQL...');

        // Define models
        const AttendanceModel = Attendance(pgSequelize);
        const ChildModel = Child(pgSequelize);

        // Create tables without forcing (safer for production)
        await pgSequelize.sync({ alter: false });
        console.log('✅ PostgreSQL tables ready.');

        // Import Attendance
        await importCSVToPostgres(AttendanceModel, 'attendance.csv');
        // Import Children
        await importCSVToPostgres(ChildModel, 'children.csv');

        // --- Step 5: Verify data ---
        const attendanceCount = await AttendanceModel.count();
        const childrenCount = await ChildModel.count();
        console.log('📊 Data verification:');
        console.log(`   Attendance: ${attendanceCount} rows`);
        console.log(`   Children: ${childrenCount} rows`);

        // --- Step 6: Write migration log ---
        const logPath = path.join(CSV_OUTPUT_DIR, 'migration.log');
        const logEntry = `
========================================
Migration completed: ${new Date().toISOString()}
----------------------------------------
Tables migrated:
- attendance: ${attendanceCount} rows
- children: ${childrenCount} rows
PostgreSQL endpoint: ${PG_CONFIG.host}
Database: ${PG_CONFIG.database}
========================================
`;
        fs.appendFileSync(logPath, logEntry);

        console.log('✅ Migration completed successfully!');
        console.log(`📄 Log file: ${logPath}`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        if (pgSequelize) {
            await pgSequelize.close();
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function exportTableToCSV(db, tableName, fileName) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(CSV_OUTPUT_DIR, fileName);
        
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                reject(new Error(`Failed to export ${tableName}: ${err.message}`));
                return;
            }

            // FIXED: Handle empty tables properly
            if (!rows || rows.length === 0) {
                console.warn(`⚠️ Table ${tableName} is empty.`);
                // Don't write empty CSV, just resolve
                resolve();
                return;
            }

            const headers = Object.keys(rows[0]);
            const csvLines = [headers.join(',')];
            
            for (const row of rows) {
                const values = headers.map(header => {
                    let value = row[header];
                    if (value === null || value === undefined) {
                        return '';
                    }
                    // FIXED: Proper CSV escaping for quoted fields
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csvLines.push(values.join(','));
            }

            fs.writeFileSync(filePath, csvLines.join('\n'));
            console.log(`   ✅ Exported ${rows.length} rows from ${tableName}`);
            resolve();
        });
    });
}

async function importCSVToPostgres(Model, fileName) {
    const filePath = path.join(CSV_OUTPUT_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ CSV file ${fileName} not found, skipping.`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
        console.warn(`⚠️ No data in ${fileName}, skipping.`);
        return;
    }

    // FIXED: Better CSV parsing that handles quoted fields
    const headers = parseCSVLine(lines[0]);
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};
        
        for (let j = 0; j < headers.length; j++) {
            let value = values[j] !== undefined ? values[j] : null;
            
            if (value === 'NULL' || value === '') {
                value = null;
            }
            
            // Convert date strings for created_at
            if (headers[j] === 'created_at' && value) {
                try {
                    value = new Date(value);
                } catch (e) {
                    // Keep as is if not a valid date
                }
            }
            
            obj[headers[j]] = value;
        }

        try {
            await Model.create(obj);
            imported++;
        } catch (err) {
            console.warn(`   ⚠️ Failed to insert row ${i}: ${err.message}`);
            console.warn(`      Data: ${JSON.stringify(obj)}`);
        }
    }

    console.log(`   ✅ Imported ${imported} rows into ${Model.tableName}`);
}

/**
 * FIXED: Properly parse CSV line handling quoted fields
 * @param {string} line - CSV line to parse
 * @returns {string[]} - Array of field values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Double quote - escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add last field
    result.push(current.trim());
    return result;
}

// ============================================
// RUN MIGRATION
// ============================================

migrate();
