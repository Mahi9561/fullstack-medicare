import type { Role } from '../config/constants';

/** Attached to req.user by authenticateUser. */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  patientId: number | null;
  doctorId: number | null;
}

/** Everything a service needs to know about who is calling and from where. */
export interface Actor {
  userId: number;
  role: Role;
  patientId: number | null;
  doctorId: number | null;
  ip: string | null;
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

export interface PageParams {
  page: number;
  limit: number;
}
