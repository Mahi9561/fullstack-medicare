'use strict';

const { hash, insert, select } = require('../db/helpers');

// specialization and department name are kept identical on purpose (see "decisions" in the README).
const DOCTORS = [
  ['Meera', 'Iyer', 'General Medicine', 'MBBS, MD (Internal Medicine)', 12, 500, 'Family physician focused on preventive care and long-term conditions.'],
  ['Arjun', 'Rao', 'Cardiology', 'MBBS, DM (Cardiology)', 15, 900, 'Interventional cardiologist with a special interest in hypertension.'],
  ['Kavya', 'Nair', 'Dermatology', 'MBBS, MD (Dermatology)', 8, 700, 'Treats acne, eczema, allergies and hair loss.'],
  ['Rohan', 'Mehta', 'Pediatrics', 'MBBS, DCH', 10, 600, 'Child health, growth monitoring and vaccinations.'],
  ['Sanjay', 'Kulkarni', 'Orthopedics', 'MBBS, MS (Orthopedics)', 18, 800, 'Joint replacement and sports injuries.'],
  ['Ananya', 'Das', 'Neurology', 'MBBS, DM (Neurology)', 14, 1000, 'Headache, epilepsy and movement disorders.'],
  ['Farah', 'Khan', 'Gynecology', 'MBBS, MS (Obstetrics and Gynecology)', 11, 750, 'Antenatal care and womens wellness.'],
  ['Vikram', 'Shetty', 'ENT', 'MBBS, MS (ENT)', 9, 650, 'Sinus, hearing and throat disorders.'],
];

module.exports = {
  async up(queryInterface) {
    const departments = await select(queryInterface, 'SELECT id, name FROM departments');
    const departmentId = Object.fromEntries(departments.map((d) => [d.name, d.id]));
    const password_hash = hash('Doctor@123');

    for (const [index, [first_name, last_name, specialization, qualification, experience_years, consultation_fee, bio]] of DOCTORS.entries()) {
      const userId = await insert(queryInterface, 'users', {
        email: `doctor${index + 1}@medicare.local`,
        password_hash,
        role: 'DOCTOR',
        status: 'ACTIVE',
      });
      const doctorId = await insert(queryInterface, 'doctors', {
        user_id: userId,
        first_name,
        last_name,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        bio,
      });
      await insert(queryInterface, 'doctor_departments', { doctor_id: doctorId, department_id: departmentId[specialization] });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('doctor_departments', null, {});
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('users', { role: 'DOCTOR' }, {});
  },
};
