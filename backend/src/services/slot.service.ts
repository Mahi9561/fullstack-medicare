import { SLOT_MINUTES } from '../config/constants';
import { NotFoundError } from '../errors';
import { appointmentRepository } from '../repositories/appointment.repository';
import { availabilityRepository } from '../repositories/availability.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import { dayOfWeekOf, generateSlots, isInPast } from '../utils/dateTime';

export const slotService = {
  /**
   * Slots are computed on demand, never stored: the doctor's weekly windows for that day,
   * cut into the fixed grid, minus slots held by live bookings and slots already in the past.
   */
  async getSlots(doctorId: number, date: string) {
    const doctor = await doctorRepository.findDetailById(doctorId);
    if (!doctor || doctor.user?.status !== 'ACTIVE') throw new NotFoundError('Doctor not found');

    const dayOfWeek = dayOfWeekOf(date);
    const windows = await availabilityRepository.findByDoctorAndDay(doctorId, dayOfWeek);
    const grid = generateSlots(windows, SLOT_MINUTES);
    const taken = new Set(await appointmentRepository.findSlotHolderStartTimes(doctorId, date));
    const now = new Date();

    return {
      doctor_id: doctorId,
      date,
      day_of_week: dayOfWeek,
      slot_minutes: SLOT_MINUTES,
      slots: grid.filter((slot) => !taken.has(slot.start_time) && !isInPast(date, slot.start_time, now)),
    };
  },
};
