'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('iku_records', 'documentUrl', {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
    await queryInterface.addColumn('iku_records', 'documentName', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('iku_records', 'documentType', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('iku_records', 'documentType');
    await queryInterface.removeColumn('iku_records', 'documentName');
    await queryInterface.removeColumn('iku_records', 'documentUrl');
  }
};
