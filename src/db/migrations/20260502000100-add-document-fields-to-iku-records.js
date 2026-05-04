'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('iku_records');
    if (!table.documentUrl) {
      await queryInterface.addColumn('iku_records', 'documentUrl', {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
    }
    if (!table.documentName) {
      await queryInterface.addColumn('iku_records', 'documentName', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!table.documentType) {
      await queryInterface.addColumn('iku_records', 'documentType', {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('iku_records');
    if (table.documentType) await queryInterface.removeColumn('iku_records', 'documentType');
    if (table.documentName) await queryInterface.removeColumn('iku_records', 'documentName');
    if (table.documentUrl) await queryInterface.removeColumn('iku_records', 'documentUrl');
  }
};
