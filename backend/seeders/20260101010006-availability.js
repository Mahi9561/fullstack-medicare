'use strict';

const { select } = require('../db/helpers');

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// Doctors 1-4: every weekday, morning and afternoon. Doctors 5-8: three long days plus Saturday morning.
const fullWeek = WEEKDAYS.flatMap((day) => [
  { day_of_week: day, start_time: '09:00', end_time: '13:00' },
  { day_of_week: day, start_time: '14:00', end_time: '17:00' },
]);
const partWeek = [
  ...['MONDAY', 'WEDNESDAY', 'FRIDAY'].map((day) => ({ day_of_week: day, start_time: '10:00', end_time: '16:00' })),
  { day_of_week: 'SATURDAY', start_time: '09:00', end_time: '12:00' },
];

module.exports = {
  async up(queryInterface) {
    const doctors = await select(queryInterface, 'SELECT id FROM doctors ORDER BY id');
    const rows = doctors.flatMap((doctor, index) =>
      (index < 4 ? fullWeek : partWeek).map((window) => ({ doctor_id: doctor.id, ...window })),
    );
    await queryInterface.bulkInsert('doctor_availability', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('doctor_availability', null, {});
  },
};
