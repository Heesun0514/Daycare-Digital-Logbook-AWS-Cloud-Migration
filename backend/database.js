// database.js
const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'daycare_db';

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

sequelize.authenticate()
    .then(() => {
        console.log('✅ Connected to PostgreSQL RDS successfully!');
        return sequelize.sync({ alter: true });
    })
    .catch(err => {
        console.error('❌ Unable to connect to PostgreSQL:', err.message);
        process.exit(1);
    });

module.exports = sequelize;