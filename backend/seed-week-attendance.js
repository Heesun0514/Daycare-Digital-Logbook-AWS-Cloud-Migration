require('dotenv').config();
const { Sequelize, DataTypes, Op } = require('sequelize');

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
  child_name: { type: DataTypes.STRING, allowNull: false },
  parent_email: { type: DataTypes.STRING, allowNull: false }
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

function isoDate(offsetFromMonday) {
  const d = new Date();
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday + offsetFromMonday);
  return monday.toISOString().split('T')[0];
}

const patterns = [
  { days: [1,1,1,1,1], arrival: '08:30', departure: '15:00' },
  { days: [1,1,1,0,0], arrival: '09:00', departure: '15:30' },
  { days: [1,1,0,0,0], arrival: '09:00', departure: '15:30' },
  { days: [1,0,0,0,0], arrival: '09:30', departure: '16:00' }
];

async function seedWeek() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');

    const children = await Child.findAll({ order: [['id', 'ASC']] });
    if (!children.length) {
      console.log('⚠️  No children found.');
      process.exit(1);
    }

    const startOfWeek = isoDate(0);
    const endOfWeek = isoDate(4);

    await Attendance.destroy({
      where: { date: { [Op.between]: [startOfWeek, endOfWeek] } }
    });

    let count = 0;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const pattern = patterns[i % patterns.length];

      for (let d = 0; d < 5; d++) {
        if (!pattern.days[d]) continue;
        await Attendance.create({
          child_id: child.id,
          child_name: child.child_name,
          parent_email: child.parent_email,
          arrival_time: pattern.arrival,
          departure_time: pattern.departure,
          date: isoDate(d)
        });
        count++;
      }
    }

    console.log(`🎉 Seeded ${count} attendance records for week ${startOfWeek} → ${endOfWeek}.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedWeek();
