import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../config/constants';
import { dateString, nullableText, paginationQuery, requiredText, timeString } from './common';

export const bookAppointmentBody = z.object({
  doctor_id: z.number({ invalid_type_error: 'Choose a doctor' }).int().positive(),
  appointment_date: dateString,
  start_time: timeString,
  reason: requiredText('Reason', 500),
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentBody>;

export const listAppointmentsQuery = z.object({
  scope: z.enum(['upcoming', 'history']).optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date: dateString.optional(),
  ...paginationQuery,
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuery>;

export const cancelAppointmentBody = z.object({ reason: nullableText(500) });
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentBody>;

const measurement = (min: number, max: number, label: string, integer = false) => {
  const base = z.number({ invalid_type_error: `${label} must be a number` }).min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`);
  return (integer ? base.int(`${label} must be a whole number`) : base).nullish();
};

export const vitalSignsBody = z
  .object({
    bp_systolic: measurement(50, 300, 'Systolic pressure', true),
    bp_diastolic: measurement(30, 200, 'Diastolic pressure', true),
    heart_rate: measurement(20, 300, 'Heart rate', true),
    temperature_f: measurement(80, 115, 'Temperature'),
    weight_kg: measurement(1, 500, 'Weight'),
    height_cm: measurement(30, 260, 'Height'),
    spo2: measurement(0, 100, 'SpO2', true),
  })
  .refine((v) => Object.values(v).some((x) => x !== null && x !== undefined), { message: 'Enter at least one measurement' })
  .refine((v) => (v.bp_systolic == null) === (v.bp_diastolic == null), {
    message: 'Enter both blood pressure values',
    path: ['bp_diastolic'],
  })
  .refine((v) => v.bp_systolic == null || v.bp_diastolic == null || v.bp_diastolic < v.bp_systolic, {
    message: 'Diastolic pressure must be lower than systolic',
    path: ['bp_diastolic'],
  });
export type VitalSignsInput = z.infer<typeof vitalSignsBody>;
