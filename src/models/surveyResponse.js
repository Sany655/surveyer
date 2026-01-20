'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SurveyResponse extends Model {
        static associate(models) {
            SurveyResponse.belongsTo(models.Survey, {
                foreignKey: 'survey_id',
                as: 'survey',
                onDelete: 'CASCADE'
            });

            SurveyResponse.hasMany(models.SurveyAnswer, {
                foreignKey: 'response_id',
                as: 'answers',
                onDelete: 'CASCADE'
            });
        }
    }

    SurveyResponse.init({
        survey_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        respondent_ip: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SurveyResponse',
        tableName: 'surveyresponses',
        timestamps: true
    });

    return SurveyResponse;
};
