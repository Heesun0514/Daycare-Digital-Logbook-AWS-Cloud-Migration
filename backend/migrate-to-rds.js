/**
 * Database Migration Script: SQLite → PostgreSQL (RDS)
 * 
 * Converts data from SQLite to PostgreSQL while preserving data integrity
 */

const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// ============================================
// CONFIGURATION
// ============================================

// PostgreSQL RDS Configuration
const PG_CONFIG = {
    host: process.env.DB_HOST || 'daycare-database.cj40cq8mair0.eu-west-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'daycareadmin',
    password: process.env.DB_PASSWORD || '*Dasom1015*'
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

// SQLite Database Path ( from my original project)
const SQLITE_PATH = process.env.SQLITE_DB_PATH || '../Daycare-Digital-Logbook/backend/daycare.db';
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
        allowNull: true,
        comment: 'Format: HH:MM'
    },
    departure_time: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Format: HH:MM, NULL if not checked out'
    },
    date: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Format: YYYY-MM-DD'
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
