require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');

// Database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'nirbachonhub_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: console.log,
    }
);

async function up() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('surveys');

        if (!tableInfo.is_geo_location_required) {
            console.log('Adding is_geo_location_required column...');
            await queryInterface.addColumn('surveys', 'is_geo_location_required', {
                type: DataTypes.TINYINT,
                defaultValue: 0,
                allowNull: false
            });
            console.log('Column added successfully.');
        } else {
            console.log('Column is_geo_location_required already exists.');
        }

    } catch (error) {
        console.error('Unable to connect to the database or run migration:', error);
    } finally {
        await sequelize.close();
    }
}

up();
