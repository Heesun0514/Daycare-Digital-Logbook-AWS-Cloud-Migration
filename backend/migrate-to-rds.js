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