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

async function cleanup() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');

    const emma = await Child.findOne({ where: { child_name: 'Emma Johnson' } });
    if (!emma) {
      console.log('ℹ️  Emma Johnson not found. Nothing to delete.');
      process.exit(0);
    }

    const deleted = await Attendance.destroy({ where: { child_id: emma.id } });
    console.log(`🗑️  Deleted ${deleted} attendance records.`);

    await emma.destroy();
    console.log('🗑️  Deleted Emma Johnson from children.');

    const remaining = await Child.findAll({ order: [['child_name', 'ASC']] });
    console.log('\n📋 Remaining children:');
    remaining.forEach(c => console.log(`   - ${c.child_name} (${c.parent_email})`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanup();