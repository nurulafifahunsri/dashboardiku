'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'totp_secret', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'totp_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'totp_enabled');
    await queryInterface.removeColumn('users', 'totp_secret');
  }
};
