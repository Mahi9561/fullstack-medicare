import bcrypt from 'bcrypt';
import type { AppointmentStatus, DayOfWeek, UserStatus } from '../../src/config/constants';
import {
  Appointment,
  Consultation,
  Department,
  Doctor,
  DoctorAvailability,
  DoctorDepartment,
  Medication,
  Patient,
  User,
} from '../../src/models';
import { addMinutes } from '../../src/utils/dateTime';

export const PASSWORD = 'Password1';
// Cost 4 keeps the suite fast; production hashing uses cost 10.
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

let counter = 0;
const next = (): number => {
  counter += 1;
  return counter;
};

export const createAdmin = async () => {
  const user = await User.create({ email: `admin${next()}@test.local`, password_hash: passwordHash, role: 'ADMIN' });
  return { user, email: user.email, password: PASSWORD };
};

interface PersonOverrides {
  email?: string;
  first_name?: string;
  last_name?: string;
  status?: UserStatus;
}

export const createPatient = async (overrides: PersonOverrides = {}) => {
  const n = next();
  const user = await User.create({
    email: overrides.email ?? `patient${n}@test.local`,
    password_hash: passwordHash,
    role: 'PATIENT',
    status: overrides.status ?? 'ACTIVE',
  });
  const patient = await Patient.create({
    user_id: user.id,
    first_name: overrides.first_name ?? `Pat${n}`,
    last_name: overrides.last_name ?? 'Tester',
    date_of_birth: '1990-01-01',
    gender: 'FEMALE',
    phone: '+91 90000 00000',
    address: null,
    emergency_contact: null,
  });
  return { user, patient, email: user.email, password: PASSWORD };
};

interface DoctorOverrides extends PersonOverrides {
  specialization?: string;
  consultation_fee?: number;
}

export const createDoctor = async (overrides: DoctorOverrides = {}) => {
  const n = next();
  const user = await User.create({
    email: overrides.email ?? `doctor${n}@test.local`,
    password_hash: passwordHash,
    role: 'DOCTOR',
    status: overrides.status ?? 'ACTIVE',
  });
  const doctor = await Doctor.create({
    user_id: user.id,
    first_name: overrides.first_name ?? `Doc${n}`,
    last_name: overrides.last_name ?? 'Tester',
    specialization: overrides.specialization ?? 'General Medicine',
    qualification: 'MBBS',
    experience_years: 5,
    consultation_fee: overrides.consultation_fee ?? 500,
    bio: null,
  });
  return { user, doctor, email: user.email, password: PASSWORD };
};

export const createDepartment = (name = `Department ${next()}`, is_active = true) =>
  Department.create({ name, description: null, is_active });

export const linkDoctorToDepartment = (doctorId: number, departmentId: number) =>
  DoctorDepartment.create({ doctor_id: doctorId, department_id: departmentId });

export const createMedication = (overrides: { name?: string; is_active?: boolean } = {}) =>
  Medication.create({ name: overrides.name ?? `Medication ${next()}`, description: null, is_active: overrides.is_active ?? true });

export const addAvailability = (doctorId: number, day: DayOfWeek, start: string, end: string) =>
  DoctorAvailability.create({ doctor_id: doctorId, day_of_week: day, start_time: start, end_time: end });

export const createAppointment = (
  patientId: number,
  doctorId: number,
  date: string,
  start: string,
  status: AppointmentStatus = 'BOOKED',
) =>
  Appointment.create({
    patient_id: patientId,
    doctor_id: doctorId,
    appointment_date: date,
    start_time: start,
    end_time: addMinutes(start, 30),
    status,
    reason: 'Check-up',
  });

export const createConsultation = (appointment: Appointment) =>
  Consultation.create({
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    symptoms: 'Cough',
    diagnosis: 'Common cold',
    notes: null,
  });
