'use strict';

const { hash, insert } = require('../db/helpers');

const PATIENTS = [
  ['Aarav', 'Sharma', '1990-04-12', 'MALE', '+91 98200 10001', '12 Palm Grove, Andheri West, Mumbai', 'Pooja Sharma +91 98200 20001'],
  ['Diya', 'Patel', '1985-09-23', 'FEMALE', '+91 98200 10002', '4 Lake View Apartments, Powai, Mumbai', 'Rakesh Patel +91 98200 20002'],
  ['Kabir', 'Singh', '1978-01-30', 'MALE', '+91 98200 10003', '88 Hill Road, Bandra West, Mumbai', null],
  ['Isha', 'Verma', '2001-06-05', 'FEMALE', '+91 98200 10004', '21 Sea Breeze, Worli, Mumbai', 'Anita Verma +91 98200 20004'],
  ['Neha', 'Joshi', '1995-11-17', 'FEMALE', '+91 98200 10005', null, null],
];

module.exports = {
  async up(queryInterface) {
    const password_hash = hash('Patient@123');
    for (const [index, [first_name, last_name, date_of_birth, gender, phone, address, emergency_contact]] of PATIENTS.entries()) {
      const userId = await insert(queryInterface, 'users', {
        email: `patient${index + 1}@medicare.local`,
        password_hash,
        role: 'PATIENT',
        status: 'ACTIVE',
      });
      await insert(queryInterface, 'patients', {
        user_id: userId,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        address,
        emergency_contact,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('users', { role: 'PATIENT' }, {});
  },
};
