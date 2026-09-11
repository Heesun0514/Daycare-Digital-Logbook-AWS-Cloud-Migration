// seed-attendance.js
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'daycare_db',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging: false
    }
);

const Child = sequelize.define('Child', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    child_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    parent_email: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'children', timestamps: false });

const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    child_id: { type: DataTypes.INTEGER, allowNull: false },
    child_name: { type: DataTypes.STRING, allowNull: false },
    parent_email: { type: DataTypes.STRING, allowNull: true },
    arrival_time: { type: DataTypes.STRING, allowNull: true },
    departure_time: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'attendance', timestamps: false });

// Sample attendance for the week 8-12 September 2026
const attendanceSeed = [
    // Emma Johnson — full week = 5 days × 6.5h = 32.5h → COMPLIANT
    { child_name: 'Emma Johnson', date: '2026-09-08', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Emma Johnson', date: '2026-09-09', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Emma Johnson', date: '2026-09-10', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Emma Johnson', date: '2026-09-11', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Emma Johnson', date: '2026-09-12', arrival_time: '09:00', departure_time: '15:30' },

    // Sofia Kelly — 3 days × 6.5h = 19.5h → COMPLIANT
    { child_name: 'Sofia Kelly', date: '2026-09-08', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Sofia Kelly', date: '2026-09-09', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Sofia Kelly', date: '2026-09-10', arrival_time: '09:00', departure_time: '15:30' },

    // Liam Murphy — 2 days × 6.5h = 13h → AT RISK
    { child_name: 'Liam Murphy', date: '2026-09-08', arrival_time: '09:00', departure_time: '15:30' },
    { child_name: 'Liam Murphy', date: '2026-09-09', arrival_time: '09:00', departure_time: '15:30' },

    // Aoife Byrne — 1 day = 6.5h → NON-COMPLIANT
    { child_name: 'Aoife Byrne', date: '2026-09-08', arrival_time: '09:00', departure_time: '15:30' }

    // Cian O'Brien — no records → not shown
];

async function seedAttendance() {
    try {
        console.log('🔄 Connecting to RDS...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        for (const row of attendanceSeed) {
            const child = await Child.findOne({ where: { child_name: row.child_name } });
            if (!child) {
                console.warn(`⚠️  Skipping ${row.child_name} — not found in children table`);
                continue;
            }

            await Attendance.create({
                child_id: child.id,
                child_name: child.child_name,
                parent_email: child.parent_email,
                arrival_time: row.arrival_time,
                departure_time: row.departure_time,
                date: row.date
            });
            console.log(`   ✅ ${row.child_name} — ${row.date}`);
        }

        console.log(`\n🎉 Seeded ${attendanceSeed.length} attendance records.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seedAttendance();