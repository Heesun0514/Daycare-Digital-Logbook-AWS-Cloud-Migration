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

// 25 children — mix of Irish first names and surnames, no duplicates
const seedChildren = [
  { child_name: 'Aoife Byrne',       parent_email: 'aoife.byrne@example.ie' },
  { child_name: 'Cian O\'Brien',     parent_email: 'cian.obrien@example.ie' },
  { child_name: 'Saoirse Murphy',    parent_email: 'saoirse.murphy@example.ie' },
  { child_name: 'Fionn Gallagher',   parent_email: 'fionn.gallagher@example.ie' },
  { child_name: 'Niamh Kelly',       parent_email: 'niamh.kelly@example.ie' },
  { child_name: 'Oisin Ryan',        parent_email: 'oisin.ryan@example.ie' },
  { child_name: 'Ciara Doyle',       parent_email: 'ciara.doyle@example.ie' },
  { child_name: 'Liam Walsh',        parent_email: 'liam.walsh@example.ie' },
  { child_name: 'Eabha McCarthy',    parent_email: 'eabha.mccarthy@example.ie' },
  { child_name: 'Darragh Nolan',     parent_email: 'darragh.nolan@example.ie' },
  { child_name: 'Molly Kavanagh',    parent_email: 'molly.kavanagh@example.ie' },
  { child_name: 'Sean Lynch',        parent_email: 'sean.lynch@example.ie' },
  { child_name: 'Emily Brennan',     parent_email: 'emily.brennan@example.ie' },
  { child_name: 'Conor O\'Connor',   parent_email: 'conor.oconnor@example.ie' },
  { child_name: 'Sophie Fitzgerald', parent_email: 'sophie.fitzgerald@example.ie' },
  { child_name: 'Jack Donnelly',     parent_email: 'jack.donnelly@example.ie' },
  { child_name: 'Aoibhinn Hayes',    parent_email: 'aoibhinn.hayes@example.ie' },
  { child_name: 'Fionnuala Ryan',    parent_email: 'fionnuala.ryan@example.ie' },
  { child_name: 'Padraig Keane',     parent_email: 'padraig.keane@example.ie' },
  { child_name: 'Siobhan Moran',     parent_email: 'siobhan.moran@example.ie' },
  { child_name: 'Eoin Hogan',        parent_email: 'eoin.hogan@example.ie' },
  { child_name: 'Roisin Burke',      parent_email: 'roisin.burke@example.ie' },
  { child_name: 'Tadhg Brennan',     parent_email: 'tadhg.brennan@example.ie' },
  { child_name: 'Aisling Casey',     parent_email: 'aisling.casey@example.ie' },
  { child_name: 'Cathal Sheridan',   parent_email: 'cathal.sheridan@example.ie' }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected.');

    // Make sure tables exist
    await Child.sync();
    await Attendance.sync();

    let created = 0;
    for (const child of seedChildren) {
      const exists = await Child.findOne({ where: { child_name: child.child_name } });
      if (exists) {
        console.log(`   ⏭️  Skipped (already exists): ${child.child_name}`);
        continue;
      }
      await Child.create(child);
      created++;
      console.log(`   ✅ ${child.child_name} (${child.parent_email})`);
    }

    const total = await Child.count();
    console.log(`\n🎉 Created ${created} new children. Total in DB: ${total}.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();