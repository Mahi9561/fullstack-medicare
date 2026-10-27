import { SLOT_MINUTES } from '../config/constants';
import { sequelize } from '../config/database';
import { findOverlap } from '../domain/availability';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { availabilityRepository } from '../repositories/availability.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { patientRepository } from '../repositories/patient.repository';
import type { Actor, Paginated } from '../types';
import { requireDoctorId } from '../utils/actor';
import { timeToMinutes, todayLocal } from '../utils/dateTime';
import { buildMeta, offsetOf } from '../utils/pagination';
import type { SearchPageQuery } from '../validators/common';
import type { ListDoctorsQuery, ReplaceAvailabilityInput, UpdateDoctorProfileInput } from '../validators/doctor.validator';
import { auditService } from './audit.service';
import { toOwnDoctor, toPatientProfile, toPublicDoctor } from './mappers';
import { slotService } from './slot.service';

export const doctorService = {
  /** Patient-facing search: active doctors only, filtered and paginated in SQL. */
  async list(query: ListDoctorsQuery): Promise<Paginated<unknown>> {
    const { rows, count } = await doctorRepository.search({
      search: query.search,
      specialization: query.specialization,
      activeOnly: true,
      limit: query.limit,
      offset: offsetOf(query),
    });
    const departments = await doctorRepository.findDepartmentsByDoctorIds(rows.map((doctor) => doctor.id));
    return {
      items: rows.map((doctor) => toPublicDoctor(doctor, departments.get(doctor.id) ?? [])),
      meta: buildMeta(query, count),
    };
  },

  async getById(id: number) {
    const doctor = await doctorRepository.findDetailById(id);
    if (!doctor || doctor.user?.status !== 'ACTIVE') throw new NotFoundError('Doctor not found');
    return toPublicDoctor(doctor);
  },

  async getAvailability(actor: Actor, doctorId: number) {
    if (actor.role === 'DOCTOR' && actor.doctorId !== doctorId) {
      throw new ForbiddenError('You can only view your own schedule');
    }
    const doctor = await doctorRepository.findDetailById(doctorId);
    if (!doctor || (actor.role !== 'DOCTOR' && doctor.user?.status !== 'ACTIVE')) {
      throw new NotFoundError('Doctor not found');
    }
    return availabilityRepository.findByDoctor(doctorId);
  },

  getSlots: (doctorId: number, date: string) => slotService.getSlots(doctorId, date),

  async getProfile(actor: Actor) {
    const doctor = await doctorRepository.findDetailById(requireDoctorId(actor));
    if (!doctor) throw new NotFoundError('Doctor profile not found');
    return toOwnDoctor(doctor);
  },

  async updateProfile(actor: Actor, input: UpdateDoctorProfileInput) {
    const doctorId = requireDoctorId(actor);
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor profile not found');

    await sequelize.transaction(async (t) => {
      await doctorRepository.update(doctor, input, { transaction: t });
      await auditService.log(actor, 'PROFILE_UPDATED', { entityType: 'doctor', entityId: doctorId }, t);
    });
    return doctorService.getProfile(actor);
  },

  /** Replaces the whole weekly schedule atomically: either the new one is saved, or the old one stays. */
  async replaceAvailability(actor: Actor, input: ReplaceAvailabilityInput) {
    const doctorId = requireDoctorId(actor);
    const { windows } = input;

    if (windows.some((w) => timeToMinutes(w.end_time) - timeToMinutes(w.start_time) < SLOT_MINUTES)) {
      throw new BadRequestError(`Each time window must be at least ${SLOT_MINUTES} minutes long`);
    }
    const overlap = findOverlap(windows);
    if (overlap) {
      throw new BadRequestError(`Time windows overlap on ${overlap[0].day_of_week.toLowerCase()}`);
    }

    await sequelize.transaction(async (t) => {
      await availabilityRepository.replaceForDoctor(doctorId, windows, t);
      await auditService.log(actor, 'AVAILABILITY_UPDATED', { entityType: 'doctor', entityId: doctorId, metadata: { windows: windows.length } }, t);
    });
    return availabilityRepository.findByDoctor(doctorId);
  },

  async dashboard(actor: Actor) {
    const doctorId = requireDoctorId(actor);
    const today = todayLocal();
    const [todayCount, upcoming, completed, patients, schedule] = await Promise.all([
      appointmentRepository.countForDoctorOnDate(doctorId, today),
      appointmentRepository.countUpcomingForDoctor(doctorId, today),
      appointmentRepository.countForDoctorByStatus(doctorId, 'COMPLETED'),
      appointmentRepository.countDistinctPatientsForDoctor(doctorId),
      appointmentRepository.findScheduleForDoctor(doctorId, today),
    ]);
    return {
      today_appointments: todayCount,
      upcoming_appointments: upcoming,
      completed_appointments: completed,
      total_patients: patients,
      todays_schedule: schedule,
    };
  },

  async listPatients(actor: Actor, query: SearchPageQuery): Promise<Paginated<unknown>> {
    const doctorId = requireDoctorId(actor);
    const { rows, count } = await patientRepository.searchTreatedBy(doctorId, {
      search: query.search,
      limit: query.limit,
      offset: offsetOf(query),
    });
    return { items: rows.map(toPatientProfile), meta: buildMeta(query, count) };
  },
};
