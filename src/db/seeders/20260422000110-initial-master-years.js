'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = ['2025', '2026', '2027', '2028', '2029', '2030'].map((year, index) => ({
      id: uuidv4(),
      year,
      label: `Tahun ${year}`,
      is_active: true,
      sort_order: index + 1,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('master_years', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('master_years', null, {});
  },
};
