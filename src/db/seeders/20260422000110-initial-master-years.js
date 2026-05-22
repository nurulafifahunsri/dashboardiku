'use strict';
const { v4: uuidv4 } = require('uuid');

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

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = ['2025', '2026', '2027', '2028', '2029', '2030'].map((year, index) => ({
      id: uuidv4(),
      year,
      label: `Tahun ${year}`,
      is_active: true,
      is_default: index === 0,
      sort_order: index + 1,
      chart_colors: JSON.stringify(colorsByYear[year]),
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('master_years', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('master_years', null, {});
  },
};
