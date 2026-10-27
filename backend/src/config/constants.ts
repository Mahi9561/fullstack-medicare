export const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type Gender = (typeof GENDERS)[number];

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const APPOINTMENT_STATUSES = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that still hold the slot. Mirrors the generated `active_slot` column in MySQL. */
export const SLOT_HOLDING_STATUSES: AppointmentStatus[] = ['BOOKED', 'CONFIRMED', 'COMPLETED'];
/** Appointments that are still waiting to happen. */
export const OPEN_STATUSES: AppointmentStatus[] = ['BOOKED', 'CONFIRMED'];
/** Appointments that are finished one way or another. */
export const CLOSED_STATUSES: AppointmentStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

export const RECORD_TYPES = ['LAB_REPORT', 'IMAGING', 'VACCINATION', 'ALLERGY', 'PROCEDURE', 'OTHER'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

/** One constant drives the whole slot grid. */
export const SLOT_MINUTES = 30;

export const COOKIE_NAME = 'access_token';

export const DOUBLE_BOOKING_MESSAGE = 'Doctor is already booked for this time slot';

export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  PRESCRIPTION_CREATED: 'PRESCRIPTION_CREATED',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const AUDIT_ACTIONS = [
  'REGISTER',
  'LOGIN',
  'LOGOUT',
  'PROFILE_UPDATED',
  'AVAILABILITY_UPDATED',
  'APPOINTMENT_CREATED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_COMPLETED',
  'APPOINTMENT_NO_SHOW',
  'VITALS_RECORDED',
  'CONSULTATION_CREATED',
  'CONSULTATION_UPDATED',
  'PRESCRIPTION_CREATED',
  'PRESCRIPTION_UPDATED',
  'MEDICAL_RECORD_CREATED',
  'MEDICATION_CREATED',
  'MEDICATION_UPDATED',
  'MEDICATION_STATUS_CHANGED',
  'DEPARTMENT_CREATED',
  'DEPARTMENT_UPDATED',
  'DEPARTMENT_STATUS_CHANGED',
  'DOCTOR_CREATED',
  'DOCTOR_UPDATED',
  'DOCTOR_STATUS_CHANGED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
