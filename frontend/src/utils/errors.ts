import { ApiError } from '../services/apiClient';

/** What a failed thunk puts in `action.payload`. Plain data, so Redux can serialize it. */
export interface Rejection {
  message: string;
  status: number;
  fieldErrors: Record<string, string>;
}

export const toRejection = (error: unknown): Rejection => {
  if (error instanceof ApiError) {
    return { message: error.message, status: error.status, fieldErrors: error.fieldErrors };
  }
  return { message: error instanceof Error ? error.message : 'Something went wrong', status: 0, fieldErrors: {} };
};

/** Works for ApiError, a Rejection from `unwrap()`, or a plain string. */
export const errorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Something went wrong';
};

export const fieldErrorsOf = (error: unknown): Record<string, string> => {
  if (error && typeof error === 'object' && 'fieldErrors' in error) {
    return (error as { fieldErrors: Record<string, string> }).fieldErrors ?? {};
  }
  return {};
};
