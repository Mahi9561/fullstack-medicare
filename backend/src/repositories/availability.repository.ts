import type { Transaction } from 'sequelize';
import type { DayOfWeek } from '../config/constants';
import { DoctorAvailability } from '../models';
import type { Tx } from './types';

export interface AvailabilityInput {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export const availabilityRepository = {
  // ENUM columns sort by their declared order, so MONDAY..SUNDAY comes out in week order.
  findByDoctor: (doctorId: number, tx: Tx = {}) =>
    DoctorAvailability.findAll({
      where: { doctor_id: doctorId },
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC'],
      ],
      ...tx,
    }),

  findByDoctorAndDay: (doctorId: number, day: DayOfWeek, tx: Tx = {}) =>
    DoctorAvailability.findAll({ where: { doctor_id: doctorId, day_of_week: day }, order: [['start_time', 'ASC']], ...tx }),

  async replaceForDoctor(doctorId: number, windows: AvailabilityInput[], transaction: Transaction): Promise<void> {
    await DoctorAvailability.destroy({ where: { doctor_id: doctorId }, transaction });
    if (windows.length) {
      await DoctorAvailability.bulkCreate(
        windows.map((w) => ({ doctor_id: doctorId, ...w })),
        { transaction },
      );
    }
  },
};
