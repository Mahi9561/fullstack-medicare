'use strict';

const { dateOffset, insert, nextWeekday, select } = require('../db/helpers');

module.exports = {
  async up(queryInterface) {
    const patientRows = await select(queryInterface, 'SELECT p.id, p.user_id, u.email FROM patients p JOIN users u ON u.id = p.user_id');
    const doctorRows = await select(queryInterface, 'SELECT d.id, d.user_id, u.email FROM doctors d JOIN users u ON u.id = d.user_id');
    const medicationRows = await select(queryInterface, 'SELECT id, name FROM medications');

    const patient = (n) => patientRows.find((r) => r.email === `patient${n}@medicare.local`);
    const doctor = (n) => doctorRows.find((r) => r.email === `doctor${n}@medicare.local`);
    const medication = (name) => medicationRows.find((r) => r.name === name).id;

    const appointment = (p, d, date, start, end, status, reason, cancellation_reason = null) =>
      insert(queryInterface, 'appointments', {
        patient_id: patient(p).id,
        doctor_id: doctor(d).id,
        appointment_date: date,
        start_time: start,
        end_time: end,
        status,
        reason,
        cancellation_reason,
      });

    const consultation = (appointmentId, p, d, symptoms, diagnosis, notes) =>
      insert(queryInterface, 'consultations', {
        appointment_id: appointmentId,
        patient_id: patient(p).id,
        doctor_id: doctor(d).id,
        symptoms,
        diagnosis,
        notes,
      });

    const vitals = (appointmentId, p, d, values) =>
      insert(queryInterface, 'vital_signs', { appointment_id: appointmentId, patient_id: patient(p).id, doctor_id: doctor(d).id, ...values });

    const prescription = async (consultationId, notes, items) => {
      const id = await insert(queryInterface, 'prescriptions', { consultation_id: consultationId, notes });
      for (const [name, dosage, frequency, duration_days, instructions] of items) {
        await insert(queryInterface, 'prescription_items', {
          prescription_id: id,
          medication_id: medication(name),
          dosage,
          frequency,
          duration_days,
          instructions,
        });
      }
      return id;
    };

    const notification = (userId, type, message, entity_type, entity_id, is_read) =>
      insert(queryInterface, 'notifications', { user_id: userId, type, message, entity_type, entity_id, is_read });

    // ---- Finished visits (history for the patient and doctor screens) ----
    const a1 = await appointment(1, 1, dateOffset(-14), '09:30', '10:00', 'COMPLETED', 'Persistent cough for two weeks');
    const c1 = await consultation(a1, 1, 1, 'Dry cough and mild fever for three days', 'Acute bronchitis', 'Advised rest and fluids. Review if the fever lasts beyond five days.');
    await vitals(a1, 1, 1, { bp_systolic: 122, bp_diastolic: 80, heart_rate: 78, temperature_f: 99.1, weight_kg: 70.5, height_cm: 175, spo2: 98 });
    const rx1 = await prescription(c1, 'Complete the full course even if you feel better.', [
      ['Azithromycin 500 mg', '500 mg', 'Once daily', 3, 'Take after food'],
      ['Paracetamol 500 mg', '500 mg', 'Every 8 hours if fever', 3, null],
    ]);

    const a2 = await appointment(1, 2, dateOffset(-30), '11:00', '11:30', 'COMPLETED', 'Routine heart check-up');
    await consultation(a2, 1, 2, 'Occasional palpitations after exercise', 'Benign palpitations, ECG normal', 'Reduce caffeine. Follow up in six months.');
    await vitals(a2, 1, 2, { bp_systolic: 118, bp_diastolic: 76, heart_rate: 72, temperature_f: 98.4, weight_kg: 70, height_cm: 175, spo2: 99 });

    const a3 = await appointment(2, 1, dateOffset(-3), '10:00', '10:30', 'COMPLETED', 'Headache and tiredness');
    const c3 = await consultation(a3, 2, 1, 'Frequent headaches in the evening, tiredness', 'Tension headache', 'Screen breaks every hour. Drink more water.');
    await vitals(a3, 2, 1, { bp_systolic: 124, bp_diastolic: 82, heart_rate: 80, temperature_f: 98.6, weight_kg: 64, height_cm: 162, spo2: 99 });
    await prescription(c3, null, [['Ibuprofen 400 mg', '400 mg', 'Twice daily', 5, 'Take after food']]);

    // ---- Cancelled and missed visits ----
    await appointment(3, 3, dateOffset(-10), '14:30', '15:00', 'CANCELLED', 'Skin rash on both arms', 'Patient was unwell and will rebook');
    await appointment(4, 4, dateOffset(-2), '15:00', '15:30', 'NO_SHOW', 'Vaccination for a child');

    // ---- Upcoming visits ----
    const a6 = await appointment(1, 3, nextWeekday(1), '10:00', '10:30', 'BOOKED', 'Skin allergy follow-up');
    const a7 = await appointment(2, 2, nextWeekday(1), '14:00', '14:30', 'CONFIRMED', 'Blood pressure review');
    const a8 = await appointment(4, 1, nextWeekday(0), '09:00', '09:30', 'CONFIRMED', 'Joint pain when climbing stairs');
    const a9 = await appointment(5, 1, nextWeekday(0), '09:30', '10:00', 'BOOKED', 'Fever and sore throat');

    // ---- A few notifications so the bell is not empty ----
    await notification(patient(1).user_id, 'PRESCRIPTION_CREATED', 'Dr. Meera Iyer issued a new prescription for you.', 'prescription', rx1, true);
    await notification(patient(2).user_id, 'APPOINTMENT_CONFIRMED', 'Dr. Arjun Rao confirmed your appointment.', 'appointment', a7, false);
    await notification(patient(4).user_id, 'APPOINTMENT_CONFIRMED', 'Dr. Meera Iyer confirmed your appointment.', 'appointment', a8, false);
    await notification(doctor(3).user_id, 'APPOINTMENT_BOOKED', 'Aarav Sharma booked an appointment.', 'appointment', a6, false);
    await notification(doctor(1).user_id, 'APPOINTMENT_BOOKED', 'Neha Joshi booked an appointment.', 'appointment', a9, false);
  },

  async down(queryInterface) {
    for (const table of ['notifications', 'prescription_items', 'prescriptions', 'vital_signs', 'consultations', 'appointments']) {
      await queryInterface.bulkDelete(table, null, {});
    }
  },
};
