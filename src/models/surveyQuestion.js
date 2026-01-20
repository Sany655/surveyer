'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SurveyQuestion extends Model {
        static associate(models) {
            SurveyQuestion.belongsTo(models.Survey, {
                foreignKey: 'survey_id',
                as: 'survey',
                onDelete: 'CASCADE'
            });
        }
    }

    SurveyQuestion.init({
        survey_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        question: { // Renamed from text
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        options: {
            type: DataTypes.JSON,
            allowNull: true
        },
        validation: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SurveyQuestion',
        tableName: 'surveyquestions',
        timestamps: true
    });

    return SurveyQuestion;
};
