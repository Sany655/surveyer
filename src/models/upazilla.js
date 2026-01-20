'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Upazilla extends Model {
    static associate(models) {
      Upazilla.belongsTo(models.District, { foreignKey: 'district_id', as: 'district' });
      Upazilla.hasMany(models.Union, { foreignKey: 'upazilla_id', as: 'unions' });
    }
  }

  Upazilla.init({
    district_id: {
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
    pcode: {
      type: DataTypes.STRING(12),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Upazilla',
    tableName: 'upazillas',
    timestamps: false,
    underscored: true
  });

  return Upazilla;
};
