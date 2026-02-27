'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('iku_records', {
      id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
      },
      category: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      ikuNum: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      indicator: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      target2025: { type: Sequelize.STRING(64), allowNull: true },
      target2026: { type: Sequelize.STRING(64), allowNull: true },
      target2027: { type: Sequelize.STRING(64), allowNull: true },
      target2028: { type: Sequelize.STRING(64), allowNull: true },
      target2029: { type: Sequelize.STRING(64), allowNull: true },
      target2030: { type: Sequelize.STRING(64), allowNull: true },
      achievement2025: { type: Sequelize.STRING(64), allowNull: true },
      achievement2026: { type: Sequelize.STRING(64), allowNull: true },
      achievement2027: { type: Sequelize.STRING(64), allowNull: true },
      achievement2028: { type: Sequelize.STRING(64), allowNull: true },
      achievement2029: { type: Sequelize.STRING(64), allowNull: true },
      achievement2030: { type: Sequelize.STRING(64), allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('iku_records');
  }
};
