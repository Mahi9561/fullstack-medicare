import type { Role } from '../types';

export const paths = {
  login: '/login',
  register: '/register',
  forbidden: '/403',
  notifications: '/notifications',
  patient: {
    dashboard: '/patient/dashboard',
    profile: '/patient/profile',
    doctors: '/patient/doctors',
    doctor: (id: number | string) => `/patient/doctors/${id}`,
    appointments: '/patient/appointments',
    book: '/patient/appointments/book',
    bookWith: (doctorId: number | string) => `/patient/appointments/book?doctor=${doctorId}`,
    consultations: '/patient/consultations',
    prescriptions: '/patient/prescriptions',
    records: '/patient/medical-records',
  },
  doctor: {
    dashboard: '/doctor/dashboard',
    profile: '/doctor/profile',
    availability: '/doctor/availability',
    appointments: '/doctor/appointments',
    appointment: (id: number | string) => `/doctor/appointments/${id}`,
    patients: '/doctor/patients',
    patient: (id: number | string) => `/doctor/patients/${id}`,
    consultations: '/doctor/consultations',
    prescriptions: '/doctor/prescriptions',
  },
  admin: {
    dashboard: '/admin/dashboard',
    doctors: '/admin/doctors',
    patients: '/admin/patients',
    appointments: '/admin/appointments',
    departments: '/admin/departments',
    medications: '/admin/medications',
    reports: '/admin/reports',
  },
} as const;

export const homeFor = (role: Role): string => {
  switch (role) {
    case 'PATIENT':
      return paths.patient.dashboard;
    case 'DOCTOR':
      return paths.doctor.dashboard;
    default:
      return paths.admin.dashboard;
  }
};

/** Only follow a "return to" path if it belongs to the signed-in role, so switching accounts never lands on a 403. */
export const safeReturnPath = (role: Role, from: string | undefined): string => {
  if (from && (from === paths.notifications || from.startsWith(`/${role.toLowerCase()}/`))) return from;
  return homeFor(role);
};
