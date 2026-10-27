import type { Gender, Session } from '../types';
import { getData, postData } from './apiClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  address?: string | null;
  emergency_contact?: string | null;
}

export const authApi = {
  login: (payload: LoginPayload) => postData<Session>('/auth/login', payload),
  register: (payload: RegisterPayload) => postData<Session>('/auth/register', payload),
  logout: () => postData<null>('/auth/logout'),
  me: () => getData<Session>('/auth/me'),
};
