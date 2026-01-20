'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Division extends Model {
    static associate(models) {
      Division.hasMany(models.District, { foreignKey: 'division_id', as: 'districts' });
    }
  }

  Division.init({
    name: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    bn_name: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    pcode: {
      type: DataTypes.STRING(12),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Division',
    tableName: 'divisions',
    timestamps: false,
    underscored: true
  });

  return Division;
};
