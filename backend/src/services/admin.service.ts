import { APPOINTMENT_STATUSES } from '../config/constants';
import { sequelize } from '../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../errors';
import { adminRepository } from '../repositories/admin.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import { departmentRepository } from '../repositories/department.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { patientRepository } from '../repositories/patient.repository';
import { userRepository } from '../repositories/user.repository';
import type { Actor, Paginated } from '../types';
import { addDays, todayLocal } from '../utils/dateTime';
import { buildMeta, offsetOf } from '../utils/pagination';
import { hashPassword } from '../utils/password';
import type {
  AdminAppointmentsQuery,
  CreateDoctorInput,
  DoctorStatusInput,
  ReportsQuery,
  UpdateDoctorInput,
} from '../validators/admin.validator';
import type { SearchPageQuery } from '../validators/common';
import { auditService } from './audit.service';
import { toAdminDoctor, toPatientProfile } from './mappers';

const MAX_REPORT_DAYS = 366;

const unique = (ids: number[]): number[] => [...new Set(ids)];

const toDay = (value: unknown): string => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10));

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const loadDoctorRow = async (id: number) => {
  const doctor = await doctorRepository.findDetailById(id);
  if (!doctor) throw new NotFoundError('Doctor not found');
  return toAdminDoctor(doctor);
};

export const adminService = {
  async dashboard() {
    const totals = await adminRepository.totals(todayLocal());
    return {
      total_patients: totals.patients,
      total_doctors: totals.doctors,
      total_appointments: totals.appointments,
      completed_appointments: totals.completed,
      cancelled_appointments: totals.cancelled,
      todays_appointments: totals.todays,
    };
  },

  async reports(query: ReportsQuery) {
    const to = query.to ?? todayLocal();
    const from = query.from ?? addDays(to, -29);
    if (from > to) throw new BadRequestError('"from" must not be after "to"');
    if (daysBetween(from, to) > MAX_REPORT_DAYS) throw new BadRequestError(`Choose a range of at most ${MAX_REPORT_DAYS} days`);

    const { byStatus, byDoctor, byDay } = await adminRepository.reports(from, to);

    // Zero-fill so the UI always gets all five statuses.
    const counts: Record<string, number> = Object.fromEntries(APPOINTMENT_STATUSES.map((status) => [status, 0]));
    for (const row of byStatus) counts[row.status] = Number(row.count);

    return {
      from,
      to,
      total: Object.values(counts).reduce((sum, n) => sum + n, 0),
      by_status: APPOINTMENT_STATUSES.map((status) => ({ status, count: counts[status] })),
      by_doctor: byDoctor.map((row) => ({
        doctor_id: Number(row.doctor_id),
        first_name: row.first_name,
        last_name: row.last_name,
        specialization: row.specialization,
        total: Number(row.total),
        completed: Number(row.completed),
        cancelled: Number(row.cancelled),
      })),
      by_day: byDay.map((row) => ({ day: toDay(row.day), count: Number(row.count) })),
    };
  },

  async listDoctors(query: SearchPageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await doctorRepository.search({
      search: query.search,
      activeOnly: false,
      limit: query.limit,
      offset: offsetOf(query),
    });
    const departments = await doctorRepository.findDepartmentsByDoctorIds(rows.map((doctor) => doctor.id));
    return {
      items: rows.map((doctor) => toAdminDoctor(doctor, departments.get(doctor.id) ?? [])),
      meta: buildMeta(query, count),
    };
  },

  /** User, doctor profile and department links are created together or not at all. */
  async createDoctor(actor: Actor, input: CreateDoctorInput) {
    const password_hash = await hashPassword(input.password);
    const departmentIds = unique(input.department_ids);

    const doctorId = await sequelize.transaction(async (t) => {
      if (await userRepository.emailExists(input.email, { transaction: t })) {
        throw new ConflictError('Email is already registered');
      }
      const departments = await departmentRepository.findByIds(departmentIds, { transaction: t });
      if (departments.length !== departmentIds.length) throw new BadRequestError('One or more departments do not exist');

      const user = await userRepository.create({ email: input.email, password_hash, role: 'DOCTOR' }, { transaction: t });
      const doctor = await doctorRepository.create(
        {
          user_id: user.id,
          first_name: input.first_name,
          last_name: input.last_name,
          specialization: input.specialization,
          qualification: input.qualification,
          experience_years: input.experience_years,
          consultation_fee: input.consultation_fee,
          bio: input.bio,
        },
        { transaction: t },
      );
      await doctorRepository.replaceDepartments(doctor.id, departmentIds, t);
      await auditService.log(actor, 'DOCTOR_CREATED', { entityType: 'doctor', entityId: doctor.id }, t);
      return doctor.id;
    });

    return loadDoctorRow(doctorId);
  },

  async updateDoctor(actor: Actor, id: number, input: UpdateDoctorInput) {
    const departmentIds = unique(input.department_ids);
    const { department_ids: _ignored, ...profile } = input;

    await sequelize.transaction(async (t) => {
      const doctor = await doctorRepository.findById(id, { transaction: t });
      if (!doctor) throw new NotFoundError('Doctor not found');
      const departments = await departmentRepository.findByIds(departmentIds, { transaction: t });
      if (departments.length !== departmentIds.length) throw new BadRequestError('One or more departments do not exist');

      await doctorRepository.update(doctor, profile, { transaction: t });
      await doctorRepository.replaceDepartments(id, departmentIds, t);
      await auditService.log(actor, 'DOCTOR_UPDATED', { entityType: 'doctor', entityId: id }, t);
    });
    return loadDoctorRow(id);
  },

  /** Deactivating flips users.status: the doctor can no longer log in or be booked. History stays intact. */
  async setDoctorStatus(actor: Actor, id: number, input: DoctorStatusInput) {
    await sequelize.transaction(async (t) => {
      const doctor = await doctorRepository.findById(id, { transaction: t });
      if (!doctor) throw new NotFoundError('Doctor not found');
      const user = await userRepository.findById(doctor.user_id, { transaction: t });
      if (!user) throw new NotFoundError('Doctor account not found');
      await userRepository.setStatus(user, input.status, { transaction: t });
      await auditService.log(actor, 'DOCTOR_STATUS_CHANGED', { entityType: 'doctor', entityId: id, metadata: { status: input.status } }, t);
    });
    return loadDoctorRow(id);
  },

  /** Profile fields only: admins never see clinical data. */
  async listPatients(query: SearchPageQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await patientRepository.search({
      search: query.search,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows.map(toPatientProfile), meta: buildMeta(query, count) };
  },

  async listAppointments(query: AdminAppointmentsQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await appointmentRepository.list({
      status: query.status,
      doctorId: query.doctor_id,
      date: query.date,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows, meta: buildMeta(query, count) };
  },
};
