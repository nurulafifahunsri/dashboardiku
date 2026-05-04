'use strict';

const targets = {
  '1-1': { '2025': '49.7', '2026': '50', '2027': '51', '2028': '52', '2029': '53', '2030': '54' },
  '1-2': { '2025': '38.9', '2026': '40', '2027': '43', '2028': '45', '2029': '48', '2030': '50' },
  '4-1': { '2025': '37.33', '2026': '44.6', '2027': '48', '2028': '50', '2029': '52', '2030': '55' },
  '7-1': { '2025': '30', '2026': '38', '2027': '45', '2028': '55', '2029': '70', '2030': '80' },
  '10-1': { '2025': '1', '2026': '1', '2027': '1', '2028': '1', '2029': '1', '2030': '2' },
};

const achievements = {
  '1-1': { '2026': '42.5' },
  '1-2': { '2026': '32.1' },
  '4-1': { '2026': '38.2' },
  '7-1': { '2026': '22.0' },
  '10-1': { '2026': '0' },
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const records = [
      {
        id: '1-1',
        category: 'Talenta',
        ikuNum: 'IKU 1',
        indicator: 'Angka Efisiensi Edukasi PT (S1)',
        unit: '%',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '1-2',
        category: 'Talenta',
        ikuNum: 'IKU 1',
        indicator: 'Angka Efisiensi Edukasi PT (S2)',
        unit: '%',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '4-1',
        category: 'Inovasi',
        ikuNum: 'IKU 4',
        indicator: 'Dosen yang mendapatkan rekognisi internasional',
        unit: '%',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '7-1',
        category: 'Kontribusi Keilmuan',
        ikuNum: 'IKU 7',
        indicator: 'Keterlibatan PT dalam SDG (1, 4, 17, dll)',
        unit: '%',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10-1',
        category: 'Tata Kelola Institusi',
        ikuNum: 'IKU 10',
        indicator: 'Jumlah unit Zona Integritas - WBK/WBBM',
        unit: 'Unit',
        createdAt: now,
        updatedAt: now,
      }
    ];

    const yearValues = records.flatMap((record) =>
      Object.keys(targets[record.id]).map((year) => ({
        id: `${record.id}-${year}`,
        iku_record_id: record.id,
        year,
        target_value: targets[record.id][year],
        achievement_value: achievements[record.id]?.[year] || null,
        createdAt: now,
        updatedAt: now,
      }))
    );

    await queryInterface.bulkInsert('iku_records', records, {});
    await queryInterface.bulkInsert('iku_record_year_values', yearValues, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('iku_record_year_values', null, {});
    await queryInterface.bulkDelete('iku_records', null, {});
  }
};
