'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('master_years', 'year', {
      type: Sequelize.STRING(16),
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('master_years', 'year', {
      type: Sequelize.ENUM('2025', '2026', '2027', '2028', '2029', '2030'),
      allowNull: false,
      unique: true,
    });
  },
};
