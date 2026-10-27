import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, getData, setUnauthorizedHandler } from './apiClient';

const originalAdapter = apiClient.defaults.adapter;

/** Makes every request fail the way a real server answer (or a dead network, when status is null) would. */
const failWith = (status: number | null, data?: unknown) => {
  apiClient.defaults.adapter = async (config) => {
    const response = status === null ? undefined : { status, statusText: '', headers: {}, config, data };
    throw new AxiosError('failed', 'ERR_TEST', config as InternalAxiosRequestConfig, null, response as never);
  };
};

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

describe('apiClient error handling', () => {
  it('passes the double-booking message through untouched', async () => {
    failWith(409, { success: false, message: 'Doctor is already booked for this time slot' });

    await expect(getData('/appointments')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Doctor is already booked for this time slot',
    });
  });

  it('keeps the first message per field from validation errors', async () => {
    failWith(400, {
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Enter a valid email address' },
        { field: 'email', message: 'Email is required' },
        { field: 'phone', message: 'Enter a valid phone number' },
      ],
    });

    await expect(getData('/auth/register')).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: 'Enter a valid email address', phone: 'Enter a valid phone number' },
    });
  });

  it('explains an unreachable server in plain words', async () => {
    failWith(null);

    await expect(getData('/doctors')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Cannot reach the server') });
  });

  it('signs the user out on a 401 from a normal endpoint', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    failWith(401, { message: 'Authentication required' });

    await expect(getData('/appointments')).rejects.toBeTruthy();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not treat a 401 from the auth endpoints as an expired session', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    failWith(401, { message: 'Invalid email or password' });

    await expect(getData('/auth/login')).rejects.toBeTruthy();
    await expect(getData('/auth/me')).rejects.toBeTruthy();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
