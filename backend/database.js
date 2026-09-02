
// database.js - PostgreSQL RDS Connection using Sequelize
const { Sequelize } = require('sequelize');

// Read environment variables (set in Elastic Beanstalk or .env)
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'daycare_db';

// Check if we're in production (Elastic Beanstalk) or local
const isProduction = process.env.NODE_ENV === 'production';

// Configure Sequelize for PostgreSQL
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false, // Set to true for debugging SQL queries
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Connected to PostgreSQL RDS successfully!');
        console.log(`📡 Host: ${DB_HOST}:${DB_PORT}`);
        console.log(`📁 Database: ${DB_NAME}`);
    })
    .catch(err => {
        console.error('❌ Unable to connect to PostgreSQL:', err.message);
        // In production, we might want to exit if DB connection fails
        if (isProduction) {
            process.exit(1);
        }
    });

// Export the sequelize instance for use in other files
module.exports = sequelize;