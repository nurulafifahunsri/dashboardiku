'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const records = [
      {
        id: '1-1',
        category: 'Talenta',
        ikuNum: 'IKU 1',
        indicator: 'Angka Efisiensi Edukasi PT (S1)',
        unit: '%',
        target2025: '49.7', target2026: '50', target2027: '51', target2028: '52', target2029: '53', target2030: '54',
        achievement2026: '42.5',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '1-2',
        category: 'Talenta',
        ikuNum: 'IKU 1',
        indicator: 'Angka Efisiensi Edukasi PT (S2)',
        unit: '%',
        target2025: '38.9', target2026: '40', target2027: '43', target2028: '45', target2029: '48', target2030: '50',
        achievement2026: '32.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4-1',
        category: 'Inovasi',
        ikuNum: 'IKU 4',
        indicator: 'Dosen yang mendapatkan rekognisi internasional',
        unit: '%',
        target2025: '37.33', target2026: '44.6', target2027: '48', target2028: '50', target2029: '52', target2030: '55',
        achievement2026: '38.2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '7-1',
        category: 'Kontribusi Keilmuan',
        ikuNum: 'IKU 7',
        indicator: 'Keterlibatan PT dalam SDG (1, 4, 17, dll)',
        unit: '%',
        target2025: '30', target2026: '38', target2027: '45', target2028: '55', target2029: '70', target2030: '80',
        achievement2026: '22.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '10-1',
        category: 'Tata Kelola Institusi',
        ikuNum: 'IKU 10',
        indicator: 'Jumlah unit Zona Integritas - WBK/WBBM',
        unit: 'Unit',
        target2025: '1', target2026: '1', target2027: '1', target2028: '1', target2029: '1', target2030: '2',
        achievement2026: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await queryInterface.bulkInsert('iku_records', records, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('iku_records', null, {});
  }
};
