'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Items', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      layer: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      availability: {
        type: Sequelize.STRING,
        allowNull: false
      },
      start: Sequelize.DATE,
      end: Sequelize.DATE,
      users: Sequelize.STRING,
      colors: Sequelize.JSON,
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Items');
  }
};
