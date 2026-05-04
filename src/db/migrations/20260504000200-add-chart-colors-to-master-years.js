'use strict';

const colorsByYear = {
  '2025': {
    categories: {
      Talenta: '#17624a',
      Inovasi: '#197a9a',
      'Kontribusi Keilmuan': '#ce7b34',
      'Tata Kelola Institusi': '#b23b6b',
    },
    target: '#ce7b34',
    realization: '#17624a',
  },
  '2026': {
    categories: {
      Talenta: '#2b6cb0',
      Inovasi: '#8f4fbf',
      'Kontribusi Keilmuan': '#c2410c',
      'Tata Kelola Institusi': '#0f766e',
    },
    target: '#8f4fbf',
    realization: '#0f766e',
  },
  '2027': {
    categories: {
      Talenta: '#b45309',
      Inovasi: '#047857',
      'Kontribusi Keilmuan': '#be185d',
      'Tata Kelola Institusi': '#2563eb',
    },
    target: '#b45309',
    realization: '#2563eb',
  },
  '2028': {
    categories: {
      Talenta: '#7c3aed',
      Inovasi: '#15803d',
      'Kontribusi Keilmuan': '#dc2626',
      'Tata Kelola Institusi': '#0369a1',
    },
    target: '#dc2626',
    realization: '#15803d',
  },
  '2029': {
    categories: {
      Talenta: '#0e7490',
      Inovasi: '#a16207',
      'Kontribusi Keilmuan': '#6d28d9',
      'Tata Kelola Institusi': '#be123c',
    },
    target: '#a16207',
    realization: '#0e7490',
  },
  '2030': {
    categories: {
      Talenta: '#4d7c0f',
      Inovasi: '#c026d3',
      'Kontribusi Keilmuan': '#1d4ed8',
      'Tata Kelola Institusi': '#ea580c',
    },
    target: '#ea580c',
    realization: '#1d4ed8',
  },
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('master_years');
    if (!table.chart_colors) {
      await queryInterface.addColumn('master_years', 'chart_colors', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    for (const [year, colors] of Object.entries(colorsByYear)) {
      await queryInterface.bulkUpdate(
        'master_years',
        { chart_colors: JSON.stringify(colors), updatedAt: new Date() },
        { year }
      );
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('master_years');
    if (table.chart_colors) {
      await queryInterface.removeColumn('master_years', 'chart_colors');
    }
  },
};
