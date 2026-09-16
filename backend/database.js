require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// ── Environment variables ──
const DB_NAME     = process.env.DB_NAME     || 'daycare_db';
const DB_USER     = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST     = process.env.DB_HOST;

// ── SSL toggle ──
// Enabled by default (RDS). Set DB_SSL=false for local Docker / CI Postgres.
const useSSL = process.env.DB_SSL !== 'false';

// ── Sequelize instance ──
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    dialectOptions: useSSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    logging: false
});

// ── Database initialization ──
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL successfully!');

        await sequelize.sync({ alter: false });
        console.log('✅ Database models synchronized!');

        return true;
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        return false;
    }
}

// ── Exports ──
module.exports = {
    sequelize,
    initializeDatabase,
    DataTypes
};