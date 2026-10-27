import { QueryTypes } from 'sequelize';
import { Appointment, Doctor, Patient, sequelize } from '../models';

export interface StatusCount {
  status: string;
  count: number;
}
export interface DoctorReportRow {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  total: number;
  completed: number;
  cancelled: number;
}
export interface DayCount {
  day: string;
  count: number;
}

export const adminRepository = {
  async totals(today: string) {
    const [patients, doctors, appointments, completed, cancelled, todays] = await Promise.all([
      Patient.count(),
      Doctor.count(),
      Appointment.count(),
      Appointment.count({ where: { status: 'COMPLETED' } }),
      Appointment.count({ where: { status: 'CANCELLED' } }),
      Appointment.count({ where: { appointment_date: today } }),
    ]);
    return { patients, doctors, appointments, completed, cancelled, todays };
  },

  /** Plain aggregate SQL: GROUP BY is clearer here than building it through the ORM. */
  async reports(from: string, to: string) {
    const replacements = { from, to };

    const byStatus = await sequelize.query<StatusCount>(
      `SELECT status, COUNT(*) AS count
         FROM appointments
        WHERE appointment_date BETWEEN :from AND :to
        GROUP BY status`,
      { replacements, type: QueryTypes.SELECT },
    );

    const byDoctor = await sequelize.query<DoctorReportRow>(
      `SELECT d.id AS doctor_id, d.first_name, d.last_name, d.specialization,
              COUNT(a.id) AS total,
              COALESCE(SUM(a.status = 'COMPLETED'), 0) AS completed,
              COALESCE(SUM(a.status = 'CANCELLED'), 0) AS cancelled
         FROM doctors d
         LEFT JOIN appointments a
           ON a.doctor_id = d.id AND a.appointment_date BETWEEN :from AND :to
        GROUP BY d.id, d.first_name, d.last_name, d.specialization
        ORDER BY total DESC, d.last_name ASC`,
      { replacements, type: QueryTypes.SELECT },
    );

    const byDay = await sequelize.query<DayCount>(
      `SELECT appointment_date AS day, COUNT(*) AS count
         FROM appointments
        WHERE appointment_date BETWEEN :from AND :to
        GROUP BY appointment_date
        ORDER BY appointment_date ASC`,
      { replacements, type: QueryTypes.SELECT },
    );

    return { byStatus, byDoctor, byDay };
  },
};
