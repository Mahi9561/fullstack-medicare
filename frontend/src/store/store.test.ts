import { describe, expect, it } from 'vitest';
import { bootstrapSession, login, logout, sessionExpired } from '../features/auth/authSlice';
import type { Session } from '../types';
import { makeStore } from './store';

const session: Session = {
  user: { id: 1, email: 'patient1@medicare.local', role: 'PATIENT', status: 'ACTIVE' },
  profile: {
    id: 10,
    user_id: 1,
    first_name: 'Aarav',
    last_name: 'Shah',
    date_of_birth: '1990-01-01',
    gender: 'MALE',
    phone: '+91 90000 00000',
    address: null,
    emergency_contact: null,
  },
};

const credentials = { email: 'patient1@medicare.local', password: 'Patient@123' };

describe('session state', () => {
  it('starts idle with nobody signed in', () => {
    const store = makeStore();

    expect(store.getState().auth.status).toBe('idle');
    expect(store.getState().user.user).toBeNull();
  });

  it('stores the user and profile after a login', () => {
    const store = makeStore();
    store.dispatch(login.fulfilled(session, 'req-1', credentials));

    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().user.user?.role).toBe('PATIENT');
    expect(store.getState().user.profile?.first_name).toBe('Aarav');
  });

  it('treats a 401 on boot as "not signed in", without an error banner', () => {
    const store = makeStore();
    store.dispatch(bootstrapSession.rejected(null, 'req-1', undefined, { message: 'Authentication required', status: 401, fieldErrors: {} }));

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.error).toBeNull();
  });

  it('shows a banner when the server cannot be reached on boot', () => {
    const store = makeStore();
    store.dispatch(bootstrapSession.rejected(null, 'req-1', undefined, { message: 'Cannot reach the server.', status: 0, fieldErrors: {} }));

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.error).toBe('Cannot reach the server.');
  });

  it('clears the user on logout', () => {
    const store = makeStore();
    store.dispatch(login.fulfilled(session, 'req-1', credentials));
    store.dispatch(logout.fulfilled(undefined, 'req-2'));

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().user.user).toBeNull();
    expect(store.getState().user.profile).toBeNull();
  });

  it('clears the user and explains why when the session expires mid-use', () => {
    const store = makeStore();
    store.dispatch(login.fulfilled(session, 'req-1', credentials));
    store.dispatch(sessionExpired());

    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.error).toMatch(/expired/i);
    expect(store.getState().user.user).toBeNull();
  });
});
