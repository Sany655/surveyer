'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Union extends Model {
    static associate(models) {
      Union.belongsTo(models.Upazilla, { foreignKey: 'upazilla_id', as: 'upazilla' });
    }
  }

  Union.init({
    upazilla_id: {
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
    modelName: 'Union',
    tableName: 'unions',
    timestamps: false,
    underscored: true
  });

  return Union;
};
