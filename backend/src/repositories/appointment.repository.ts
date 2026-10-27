import { Op, type CreationAttributes, type Transaction, type WhereOptions } from 'sequelize';
import { CLOSED_STATUSES, OPEN_STATUSES, SLOT_HOLDING_STATUSES, type AppointmentStatus } from '../config/constants';
import { Appointment, Consultation, Doctor, Patient, Prescription, VitalSign } from '../models';
import { todayLocal } from '../utils/dateTime';
import { andWhere } from '../utils/search';
import type { Paging, Tx } from './types';

export interface AppointmentListParams extends Paging {
  patientId?: number;
  doctorId?: number;
  scope?: 'upcoming' | 'history';
  status?: AppointmentStatus;
  date?: string;
}

const listIncludes = () => [
  { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name', 'phone'] },
  { model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'specialization'] },
  { model: Consultation, as: 'consultation', attributes: ['id'], required: false },
];

export const appointmentRepository = {
  create: (values: CreationAttributes<Appointment>, tx: Tx = {}) => Appointment.create(values, tx),

  update: (appointment: Appointment, values: Partial<CreationAttributes<Appointment>>, tx: Tx = {}) =>
    appointment.update(values, tx),

  findById: (id: number, tx: Tx = {}) => Appointment.findByPk(id, tx),

  /** Locks only the appointment row, so concurrent status changes on it run one after the other. */
  findByIdForUpdate: (id: number, transaction: Transaction) =>
    Appointment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }),

  findDetailById: (id: number) =>
    Appointment.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name', 'specialization', 'consultation_fee'] },
        {
          model: Consultation,
          as: 'consultation',
          required: false,
          include: [{ model: Prescription, as: 'prescription', attributes: ['id'], required: false }],
        },
        { model: VitalSign, as: 'vital_signs', required: false },
      ],
    }),

  list(params: AppointmentListParams) {
    const today = todayLocal();
    const conditions: WhereOptions[] = [];
    if (params.patientId) conditions.push({ patient_id: params.patientId });
    if (params.doctorId) conditions.push({ doctor_id: params.doctorId });
    if (params.status) conditions.push({ status: params.status });
    if (params.date) conditions.push({ appointment_date: params.date });
    if (params.scope === 'upcoming') {
      conditions.push({ appointment_date: { [Op.gte]: today }, status: { [Op.in]: OPEN_STATUSES } });
    } else if (params.scope === 'history') {
      conditions.push({
        [Op.or]: [{ appointment_date: { [Op.lt]: today } }, { status: { [Op.in]: CLOSED_STATUSES } }],
      });
    }
    const direction = params.scope === 'upcoming' ? 'ASC' : 'DESC';
    return Appointment.findAndCountAll({
      where: andWhere(conditions),
      include: listIncludes(),
      order: [
        ['appointment_date', direction],
        ['start_time', direction],
        ['id', direction],
      ],
      limit: params.limit,
      offset: params.offset,
    });
  },

  /** Is the slot taken by a booking that still counts (booked, confirmed or completed)? */
  existsSlotHolder: async (doctorId: number, date: string, startTime: string, tx: Tx = {}) =>
    (await Appointment.count({
      where: {
        doctor_id: doctorId,
        appointment_date: date,
        start_time: startTime,
        status: { [Op.in]: SLOT_HOLDING_STATUSES },
      },
      ...tx,
    })) > 0,

  async findSlotHolderStartTimes(doctorId: number, date: string): Promise<string[]> {
    const rows = await Appointment.findAll({
      attributes: ['start_time'],
      where: { doctor_id: doctorId, appointment_date: date, status: { [Op.in]: SLOT_HOLDING_STATUSES } },
    });
    return rows.map((row) => row.start_time);
  },

  /** True when the doctor has at least one non-cancelled appointment with the patient. */
  existsRelationship: async (doctorId: number, patientId: number) =>
    (await Appointment.count({
      where: { doctor_id: doctorId, patient_id: patientId, status: { [Op.ne]: 'CANCELLED' } },
    })) > 0,

  countForDoctorOnDate: (doctorId: number, date: string) =>
    Appointment.count({
      where: { doctor_id: doctorId, appointment_date: date, status: { [Op.in]: OPEN_STATUSES } },
    }),

  countUpcomingForDoctor: (doctorId: number, afterDate: string) =>
    Appointment.count({
      where: { doctor_id: doctorId, appointment_date: { [Op.gt]: afterDate }, status: { [Op.in]: OPEN_STATUSES } },
    }),

  countForDoctorByStatus: (doctorId: number, status: AppointmentStatus) =>
    Appointment.count({ where: { doctor_id: doctorId, status } }),

  countDistinctPatientsForDoctor: (doctorId: number) =>
    Appointment.count({
      where: { doctor_id: doctorId, status: { [Op.ne]: 'CANCELLED' } },
      distinct: true,
      col: 'patient_id',
    }),

  findScheduleForDoctor: (doctorId: number, date: string) =>
    Appointment.findAll({
      where: { doctor_id: doctorId, appointment_date: date, status: { [Op.ne]: 'CANCELLED' } },
      include: listIncludes(),
      order: [
        ['start_time', 'ASC'],
        ['id', 'ASC'],
      ],
    }),

  findNextForPatient: (patientId: number) =>
    Appointment.findOne({
      where: { patient_id: patientId, appointment_date: { [Op.gte]: todayLocal() }, status: { [Op.in]: OPEN_STATUSES } },
      include: listIncludes(),
      order: [
        ['appointment_date', 'ASC'],
        ['start_time', 'ASC'],
      ],
    }),

  countUpcomingForPatient: (patientId: number) =>
    Appointment.count({
      where: { patient_id: patientId, appointment_date: { [Op.gte]: todayLocal() }, status: { [Op.in]: OPEN_STATUSES } },
    }),
};
