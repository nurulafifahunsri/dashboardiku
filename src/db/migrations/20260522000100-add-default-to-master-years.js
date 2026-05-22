'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('master_years', 'is_default', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'is_active',
    });

    await queryInterface.sequelize.query(`
      UPDATE master_years
      SET is_default = TRUE
      WHERE id = (
        SELECT id FROM (
          SELECT id
          FROM master_years
          WHERE is_active = TRUE
          ORDER BY sort_order ASC, year ASC
          LIMIT 1
        ) AS default_year
      )
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('master_years', 'is_default');
  },
};
