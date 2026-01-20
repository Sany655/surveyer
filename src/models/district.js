'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class District extends Model {
    static associate(models) {
      District.belongsTo(models.Division, { foreignKey: 'division_id', as: 'division' });
      District.hasMany(models.Upazilla, { foreignKey: 'district_id', as: 'upazillas' });
    }
  }

  District.init({
    division_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    bn_name: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    lat: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    lon: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    pcode: {
      type: DataTypes.STRING(12),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'District',
    tableName: 'districts',
    timestamps: false,
    underscored: true
  });

  return District;
};
