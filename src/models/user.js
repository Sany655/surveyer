'use strict';
const { Model } = require('sequelize');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Division, {
        foreignKey: 'division_id',
        as: 'division'
      });

      User.belongsTo(models.District, {
        foreignKey: 'district_id',
        as: 'district'
      });

      User.belongsTo(models.Upazilla, {
        foreignKey: 'upazilla_id',
        as: 'upazilla'
      });

      User.belongsTo(models.Union, {
        foreignKey: 'union_id',
        as: 'union'
      });

    }

    // Compare password
    matchPassword = async function (plainPass) {
      return await bcrypt.compare(plainPass, this.password);
    };

    // Sign JWT
    getSignedJwtToken = function () {
      return jwt.sign(
        { id: this.id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRED_IN }
      );
    }
  }

  User.init({
    name: {
      type: DataTypes.STRING(50),
    },
    employee_id: {
      type: DataTypes.STRING(50),
    },
    fingerprint_template: {
      type: DataTypes.BLOB('long'),
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    msisdn: {
      type: DataTypes.STRING(15),
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    division_id: {
      type: DataTypes.INTEGER,
    },
    district_id: {
      type: DataTypes.INTEGER,
    },
    company_id: {
      type: DataTypes.INTEGER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
    },
    avatar: {
      type: DataTypes.STRING(255),
    },
    department_id: {
      type: DataTypes.INTEGER,
    },
    upazilla_id: {
      type: DataTypes.INTEGER,
    },
    union_id: {
      type: DataTypes.INTEGER,
    },
    ward: {
      type: DataTypes.INTEGER,
    },
    designation_id: {
      type: DataTypes.INTEGER,
    },
    joining_date: {
      type: DataTypes.DATEONLY,
    },
    createdBy: {
      type: DataTypes.INTEGER,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};
