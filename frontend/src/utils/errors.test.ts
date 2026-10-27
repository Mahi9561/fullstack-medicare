import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/apiClient';
import { errorMessage, fieldErrorsOf, toRejection } from './errors';

describe('toRejection', () => {
  it('keeps everything from an ApiError as plain data', () => {
    const error = new ApiError('Validation failed', 400, { email: 'Enter a valid email address' });

    expect(toRejection(error)).toEqual({
      message: 'Validation failed',
      status: 400,
      fieldErrors: { email: 'Enter a valid email address' },
    });
  });

  it('wraps any other error with status 0', () => {
    expect(toRejection(new Error('boom'))).toEqual({ message: 'boom', status: 0, fieldErrors: {} });
    expect(toRejection('weird').message).toBe('Something went wrong');
  });
});

describe('errorMessage and fieldErrorsOf', () => {
  it('read the message from errors, rejections and strings', () => {
    expect(errorMessage(new Error('a'))).toBe('a');
    expect(errorMessage({ message: 'b', status: 409, fieldErrors: {} })).toBe('b');
    expect(errorMessage('c')).toBe('c');
    expect(errorMessage(undefined)).toBe('Something went wrong');
  });

  it('return field errors only when they exist', () => {
    expect(fieldErrorsOf({ fieldErrors: { phone: 'Bad' } })).toEqual({ phone: 'Bad' });
    expect(fieldErrorsOf(new Error('x'))).toEqual({});
    expect(fieldErrorsOf(null)).toEqual({});
  });
});
