export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type RecordType = 'LAB_REPORT' | 'IMAGING' | 'VACCINATION' | 'ALLERGY' | 'PROCEDURE' | 'OTHER';

export const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
export const RECORD_TYPES: RecordType[] = ['LAB_REPORT', 'IMAGING', 'VACCINATION', 'ALLERGY', 'PROCEDURE', 'OTHER'];

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface DepartmentLite {
  id: number;
  name: string;
}

export interface Department extends DepartmentLite {
  description: string | null;
  is_active: boolean;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address: string | null;
  emergency_contact: string | null;
  email?: string | null;
  status?: UserStatus | null;
}

export interface DoctorProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  departments?: DepartmentLite[];
  email?: string | null;
  status?: UserStatus | null;
}

export interface Session {
  user: SessionUser;
  profile: PatientProfile | DoctorProfile | null;
}

export interface AvailabilityWindow {
  id?: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface Slot {
  start_time: string;
  end_time: string;
}

export interface SlotsResponse {
  doctor_id: number;
  date: string;
  day_of_week: DayOfWeek;
  slot_minutes: number;
  slots: Slot[];
}

export interface PersonName {
  id: number;
  first_name: string;
  last_name: string;
}

export interface VitalSigns {
  id: number;
  appointment_id: number;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  heart_rate: number | null;
  temperature_f: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  spo2: number | null;
  created_at: string;
  appointment?: { id: number; appointment_date: string; start_time: string };
}

export interface Medication {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface PrescriptionItem {
  id: number;
  medication_id: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
  medication?: { id: number; name: string };
}

export interface Prescription {
  id: number;
  consultation_id: number;
  notes: string | null;
  created_at: string;
  items?: PrescriptionItem[];
  consultation?: {
    id: number;
    appointment_id: number;
    patient_id: number;
    doctor_id: number;
    diagnosis: string;
    created_at: string;
    doctor?: PersonName & { specialization: string };
    patient?: PersonName;
  };
}

export interface Consultation {
  id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  symptoms: string;
  diagnosis: string;
  notes: string | null;
  created_at: string;
  appointment?: { id: number; appointment_date: string; start_time: string; end_time: string };
  patient?: PersonName & { date_of_birth?: string; gender?: Gender };
  doctor?: PersonName & { specialization: string };
  prescription?: (Partial<Prescription> & { id: number }) | null;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string;
  cancellation_reason: string | null;
  created_at: string;
  patient?: PersonName & Partial<PatientProfile>;
  doctor?: PersonName & { specialization: string; consultation_fee?: number };
  consultation?: Consultation | null;
  vital_signs?: VitalSigns | null;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  title: string;
  record_type: RecordType;
  description: string;
  record_date: string;
  doctor?: PersonName & { specialization: string };
}

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface PatientHistory {
  patient: PatientProfile;
  consultations: Consultation[];
  prescriptions: Prescription[];
  vital_signs: VitalSigns[];
  medical_records: MedicalRecord[];
}

export interface DoctorDashboard {
  today_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  total_patients: number;
  todays_schedule: Appointment[];
}

export interface PatientDashboard {
  next_appointment: Appointment | null;
  upcoming_count: number;
  total_consultations: number;
  recent_consultations: Consultation[];
  recent_prescriptions: Prescription[];
}

export interface AdminDashboard {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  todays_appointments: number;
}

export interface AdminReport {
  from: string;
  to: string;
  total: number;
  by_status: { status: AppointmentStatus; count: number }[];
  by_doctor: {
    doctor_id: number;
    first_name: string;
    last_name: string;
    specialization: string;
    total: number;
    completed: number;
    cancelled: number;
  }[];
  by_day: { day: string; count: number }[];
}
