'use strict';

const DEPARTMENTS = [
  ['General Medicine', 'Primary care, check-ups and everyday illness'],
  ['Cardiology', 'Heart and blood pressure care'],
  ['Dermatology', 'Skin, hair and nail conditions'],
  ['Pediatrics', 'Health care for infants, children and teenagers'],
  ['Orthopedics', 'Bones, joints and muscles'],
  ['Neurology', 'Brain, spine and nervous system'],
  ['Gynecology', "Women's health and pregnancy care"],
  ['ENT', 'Ear, nose and throat'],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'departments',
      DEPARTMENTS.map(([name, description]) => ({ name, description, is_active: true })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('departments', null, {});
  },
};
