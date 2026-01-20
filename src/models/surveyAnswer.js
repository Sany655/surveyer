'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SurveyAnswer extends Model {
        static associate(models) {
            SurveyAnswer.belongsTo(models.SurveyResponse, {
                foreignKey: 'response_id',
                as: 'response',
                onDelete: 'CASCADE'
            });

            SurveyAnswer.belongsTo(models.SurveyQuestion, {
                foreignKey: 'question_id',
                as: 'question',
                onDelete: 'CASCADE'
            });
        }
    }

    SurveyAnswer.init({
        response_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        question_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        answer_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        answer_json: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'SurveyAnswer',
        tableName: 'surveyanswers',
        timestamps: true
    });

    return SurveyAnswer;
};
