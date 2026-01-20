const { Sequelize } = require('sequelize');
require('dotenv').config();

// Using env vars directly
const sequelize = new Sequelize(
    process.env.DB_NAME || 'nirbachonhub_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: console.log
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [results, metadata] = await sequelize.query("SHOW TABLES LIKE 'districts'");
        console.log('Tables check:', results);

        if (results.length > 0) {
            const [count] = await sequelize.query("SELECT COUNT(*) as count FROM districts");
            console.log('Districts count:', count);
        } else {
            console.log('Districts table does not exist!');
            console.log('You need to run migrations or sync models.');
        }

    } catch (error) {
        console.error('Unable to connect:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
