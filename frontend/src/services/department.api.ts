import type { Department } from '../types';
import { getData, patchData, postData, putData } from './apiClient';

export interface DepartmentInput {
  name: string;
  description: string | null;
}

export const departmentApi = {
  list: () => getData<Department[]>('/departments'),
  create: (input: DepartmentInput) => postData<Department>('/departments', input),
  update: (id: number, input: DepartmentInput) => putData<Department>(`/departments/${id}`, input),
  setActive: (id: number, is_active: boolean) => patchData<Department>(`/departments/${id}/status`, { is_active }),
};
