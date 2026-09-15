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

async function wipe() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');

    const attDeleted = await Attendance.destroy({ where: {}, truncate: true, restartIdentity: true });
    console.log(`🗑️  Deleted ${attDeleted} attendance records.`);

    const childDeleted = await Child.destroy({ where: {}, truncate: true, restartIdentity: true });
    console.log(`🗑️  Deleted ${childDeleted} children.`);

    // Reset ID sequences (PostgreSQL)
    await sequelize.query('ALTER SEQUENCE children_id_seq RESTART WITH 1;');
    await sequelize.query('ALTER SEQUENCE attendance_id_seq RESTART WITH 1;');
    console.log('🔢 ID sequences reset to 1.');

    const childCount = await Child.count();
    const attCount = await Attendance.count();
    console.log(`\n📊 Children: ${childCount} | Attendance: ${attCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

wipe();