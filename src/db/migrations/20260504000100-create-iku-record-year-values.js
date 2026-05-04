'use strict';

const legacyYears = ['2025', '2026', '2027', '2028', '2029', '2030'];

const describeTable = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
};

const valueSql = (table, column) => (table?.[column] ? `\`${column}\`` : 'NULL');

const coalescedValueSql = (table, primaryColumn, fallbackColumn) => {
  const primary = valueSql(table, primaryColumn);
  const fallback = valueSql(table, fallbackColumn);
  if (primary !== 'NULL' && fallback !== 'NULL') return `COALESCE(${primary}, ${fallback})`;
  return primary !== 'NULL' ? primary : fallback;
};

const hasAnyColumn = (table, columns) => columns.some((column) => Boolean(table?.[column]));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existingYearValueTable = await describeTable(queryInterface, 'iku_record_year_values');
    if (!existingYearValueTable) {
      await queryInterface.createTable('iku_record_year_values', {
        id: {
          type: Sequelize.STRING(64),
          allowNull: false,
          primaryKey: true,
        },
        iku_record_id: {
          type: Sequelize.STRING(64),
          allowNull: false,
          references: {
            model: 'iku_records',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        year: {
          type: Sequelize.STRING(16),
          allowNull: false,
        },
        target_value: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        achievement_value: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        documentUrl: {
          type: Sequelize.STRING(512),
          allowNull: true,
        },
        documentName: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        documentType: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('iku_record_year_values', ['iku_record_id', 'year'], {
        unique: true,
        name: 'iku_record_year_values_record_year_unique',
      });
    }

    const ikuRecordsTable = await describeTable(queryInterface, 'iku_records');
    for (const year of legacyYears) {
      const columns = [
        `target${year}`,
        `achievement${year}`,
        `documentUrl${year}`,
        `documentName${year}`,
        `documentType${year}`,
        'documentUrl',
        'documentName',
        'documentType',
      ];
      if (!hasAnyColumn(ikuRecordsTable, columns)) continue;

      const target = valueSql(ikuRecordsTable, `target${year}`);
      const achievement = valueSql(ikuRecordsTable, `achievement${year}`);
      const documentUrl = coalescedValueSql(ikuRecordsTable, `documentUrl${year}`, 'documentUrl');
      const documentName = coalescedValueSql(ikuRecordsTable, `documentName${year}`, 'documentName');
      const documentType = coalescedValueSql(ikuRecordsTable, `documentType${year}`, 'documentType');
      const predicates = [target, achievement, documentUrl, documentName, documentType]
        .filter((value) => value !== 'NULL')
        .map((value) => `${value} IS NOT NULL AND ${value} <> ''`);

      if (!predicates.length) continue;

      await queryInterface.sequelize.query(`
        INSERT INTO iku_record_year_values
          (id, iku_record_id, year, target_value, achievement_value, documentUrl, documentName, documentType, createdAt, updatedAt)
        SELECT UUID(), id, '${year}', ${target}, ${achievement}, ${documentUrl}, ${documentName}, ${documentType}, NOW(), NOW()
        FROM iku_records
        WHERE ${predicates.join(' OR ')}
        ON DUPLICATE KEY UPDATE
          target_value = VALUES(target_value),
          achievement_value = VALUES(achievement_value),
          documentUrl = VALUES(documentUrl),
          documentName = VALUES(documentName),
          documentType = VALUES(documentType),
          updatedAt = NOW()
      `);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('iku_record_year_values');
  },
};
