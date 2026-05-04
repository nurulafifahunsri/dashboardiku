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
