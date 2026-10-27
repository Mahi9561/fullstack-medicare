import axios, { type AxiosError } from 'axios';
import type { ApiResponse, PageMeta, Paginated } from '../types';

/** Every failed request becomes one of these, so screens never have to inspect Axios errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ErrorBody {
  message?: string;
  errors?: { field: string; message: string }[];
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // The session is an httpOnly cookie: the browser must be told to send it to the API origin.
  withCredentials: true,
  timeout: 15000,
});

let unauthorizedHandler: (() => void) | null = null;

/** The store registers this, so the HTTP layer can end the session without importing the store. */
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

// For these calls a 401 is a normal answer ("wrong password", "not signed in yet"), not an expired session.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/me'];

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const url = error.config?.url ?? '';

    if (status === 401 && !AUTH_ENDPOINTS.some((path) => url.startsWith(path))) {
      unauthorizedHandler?.();
    }

    const fieldErrors: Record<string, string> = {};
    for (const item of body?.errors ?? []) {
      if (!(item.field in fieldErrors)) fieldErrors[item.field] = item.message;
    }

    const message =
      body?.message ??
      (error.response ? `The request failed (${status})` : 'Cannot reach the server. Check that the API is running on port 5000.');
    return Promise.reject(new ApiError(message, status, fieldErrors));
  },
);

export const getData = async <T>(url: string, params?: object): Promise<T> =>
  (await apiClient.get<ApiResponse<T>>(url, { params })).data.data;

export const getPage = async <T>(url: string, params?: object): Promise<Paginated<T>> => {
  const { data } = await apiClient.get<ApiResponse<T[]> & { meta: PageMeta }>(url, { params });
  return { items: data.data, meta: data.meta };
};

export const postData = async <T>(url: string, body?: unknown): Promise<T> =>
  (await apiClient.post<ApiResponse<T>>(url, body)).data.data;

export const putData = async <T>(url: string, body?: unknown): Promise<T> =>
  (await apiClient.put<ApiResponse<T>>(url, body)).data.data;

export const patchData = async <T>(url: string, body?: unknown): Promise<T> =>
  (await apiClient.patch<ApiResponse<T>>(url, body)).data.data;
