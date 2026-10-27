import type { Doctor, Patient } from '../models';
import type { DepartmentLite } from '../repositories/doctor.repository';

type Json = Record<string, unknown>;

const plain = (model: { toJSON(): object }): Json => model.toJSON() as unknown as Json;

const withoutUser = (json: Json): Json => {
  const { user: _user, ...rest } = json;
  return rest;
};

/** A doctor as other people see them: no login email, no account status. */
export const toPublicDoctor = (doctor: Doctor, departments?: DepartmentLite[]): Json => {
  const rest = withoutUser(plain(doctor));
  return departments ? { ...rest, departments } : rest;
};

/** The doctor's own profile, including the login email. */
export const toOwnDoctor = (doctor: Doctor): Json => ({
  ...withoutUser(plain(doctor)),
  email: doctor.user?.email ?? null,
});

/** An admin table row: email and account status included. */
export const toAdminDoctor = (doctor: Doctor, departments?: DepartmentLite[]): Json => ({
  ...withoutUser(plain(doctor)),
  ...(departments ? { departments } : {}),
  email: doctor.user?.email ?? null,
  status: doctor.user?.status ?? null,
});

export const toPatientProfile = (patient: Patient): Json => ({
  ...withoutUser(plain(patient)),
  email: patient.user?.email ?? null,
  status: patient.user?.status ?? null,
});

export const fullName = (person: { first_name: string; last_name: string }): string =>
  `${person.first_name} ${person.last_name}`;
