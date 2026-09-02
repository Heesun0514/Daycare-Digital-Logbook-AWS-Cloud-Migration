// backend/models.js
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// Define Attendance model
const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    child_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parent_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    arrival_time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departure_time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'attendance',
    timestamps: false
});

// Define Children model
const Child = sequelize.define('Child', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    child_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    parent_email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'children',
    timestamps: false
});

module.exports = { Attendance, Child };