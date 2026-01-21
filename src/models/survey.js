'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Survey extends Model {
        static associate(models) {
            // User Association
            Survey.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'creator'
            });

            // Questions Association
            Survey.hasMany(models.SurveyQuestion, {
                foreignKey: 'survey_id',
                as: 'questions',
                onDelete: 'CASCADE'
            });

            // Responses Association
            Survey.hasMany(models.SurveyResponse, {
                foreignKey: 'survey_id',
                as: 'responses',
                onDelete: 'CASCADE'
            });

            // Location Associations
            Survey.belongsTo(models.Division, { foreignKey: 'division_id', as: 'division' });
            Survey.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
            Survey.belongsTo(models.Upazilla, { foreignKey: 'upazila_id', as: 'upazila' });
            Survey.belongsTo(models.Union, { foreignKey: 'union_id', as: 'union' });
        }
    }

    Survey.init({
        unique_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        division_id: {
            type: DataTypes.INTEGER
        },
        district_id: {
            type: DataTypes.INTEGER
        },
        upazila_id: {
            type: DataTypes.INTEGER
        },
        union_id: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.TINYINT,
            defaultValue: 0 // 0: Draft, 1: Published
        }
    }, {
        sequelize,
        modelName: 'Survey',
        tableName: 'surveys',
        timestamps: true
    });

    return Survey;
};
