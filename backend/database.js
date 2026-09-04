// database.js
const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'daycare_db';


// DEBUG: Log environment variables
console.log('🔍 Database Configuration:');
console.log('   DB_HOST:', DB_HOST);
console.log('   DB_USER:', DB_USER);
console.log('   DB_PASSWORD:', DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('   DB_NAME:', DB_NAME);




const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

// Test connection but don't exit on failure
// This allows the app to start even if DB is temporarily unreachable
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL RDS successfully!');
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized!');
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('⚠️  Application is running but database routes will fail.');
        console.error('⚠️  Check that DB_HOST, DB_USER, DB_PASSWORD environment variables are set.');
        return false;
    }
}

module.exports = { sequelize, initializeDatabase };
