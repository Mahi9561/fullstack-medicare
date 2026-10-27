'use strict';

const { hash } = require('../db/helpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      { email: 'admin@medicare.local', password_hash: hash('Admin@123'), role: 'ADMIN', status: 'ACTIVE' },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { role: 'ADMIN' }, {});
  },
};
