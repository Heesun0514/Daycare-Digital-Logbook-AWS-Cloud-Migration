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

// ── Models ──
const Child = sequelize.define('Child', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    child_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    parent_email: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'children', timestamps: false });

const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    child_id: { type: DataTypes.INTEGER, allowNull: false,
        references: { model: 'children', key: 'id' } },
    child_name: { type: DataTypes.STRING, allowNull: false },
    parent_email: { type: DataTypes.STRING, allowNull: true },
    arrival_time: { type: DataTypes.STRING, allowNull: true },
    departure_time: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'attendance', timestamps: false });

// ── Real parent emails for demo ──
const seedChildren = [
    { child_name: 'Emma Johnson',  parent_email: 'emma.johnson@gmail.com' },
    { child_name: 'Sofia Kelly',   parent_email: 'sofia.kelly@gmail.com' },
    { child_name: 'Liam Murphy',   parent_email: 'liam.murphy@gmail.com' },
    { child_name: 'Aoife Byrne',   parent_email: 'aoife.byrne@gmail.com' },
    { child_name: "Cian O'Brien",  parent_email: 'cian.obrien@gmail.com' }
];

async function reset() {
    try {
        console.log('🔄 Connecting to RDS...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('🗑️  Dropping tables...');
        await Attendance.drop();
        await Child.drop();

        console.log('📦 Creating tables...');
        await Child.sync();
        await Attendance.sync();

        console.log('🌱 Seeding children...');
        for (const child of seedChildren) {
            await Child.create(child);
            console.log(`   ✅ ${child.child_name} (${child.parent_email})`);
        }

        const count = await Child.count();
        console.log(`\n🎉 Reset complete. ${count} children in database.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

reset();
