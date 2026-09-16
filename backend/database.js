const useSSL = process.env.DB_SSL !== 'false';

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
    dialectOptions: useSSL
        ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
        : {},
     logging: false
 });