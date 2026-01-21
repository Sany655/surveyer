'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';

const sequelize = new Sequelize(
    process.env.DB_NAME || 'nirbachonhub_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false,
        // dialectOptions: {
        //     ssl: (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
        //         require: true,
        //         rejectUnauthorized: false
        //     } : undefined
        // }
    }
);

const db = {};

// Import models explicitly to avoid dynamic require issues in Next.js/Webpack
const modelDefs = [
    require('./user'),
    require('./survey'),
    require('./surveyQuestion'),
    require('./surveyAnswer'),
    require('./surveyResponse'),
    require('./division'),
    require('./district'),
    require('./upazilla'), // Note: double 'l' as per file name
    require('./union'),
];

modelDefs.forEach(modelDef => {
    const model = modelDef(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
