'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'reset_token', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'reset_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE users SET email = CONCAT(username, '@fasilkom.local') WHERE email IS NULL OR email = ''"
    );

    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.createTable('master_years', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      year: {
        type: Sequelize.ENUM('2025', '2026', '2027', '2028', '2029', '2030'),
        allowNull: false,
        unique: true,
      },
      label: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('master_years');
    await queryInterface.removeColumn('users', 'reset_token_expires_at');
    await queryInterface.removeColumn('users', 'reset_token');
    await queryInterface.removeColumn('users', 'email');
  },
};
