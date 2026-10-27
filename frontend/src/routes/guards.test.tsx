import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { bootstrapSession, login } from '../features/auth/authSlice';
import { makeStore } from '../store/store';
import type { Role, Session } from '../types';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const sessionFor = (role: Role): Session => ({
  user: { id: 1, email: 'user@medicare.local', role, status: 'ACTIVE' },
  profile: null,
});

const signedIn = (role: Role) => {
  const store = makeStore();
  store.dispatch(login.fulfilled(sessionFor(role), 'req', { email: 'user@medicare.local', password: 'x' }));
  return store;
};

const signedOut = () => {
  const store = makeStore();
  store.dispatch(bootstrapSession.rejected(null, 'req', undefined, { message: 'Authentication required', status: 401, fieldErrors: {} }));
  return store;
};

const renderAt = (path: string, store: ReturnType<typeof makeStore>) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allow={['DOCTOR']} />}>
              <Route path="/doctor/dashboard" element={<p>Doctor area</p>} />
            </Route>
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/403" element={<p>Forbidden page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('route guards', () => {
  it('waits for the session check instead of flashing the login page', () => {
    renderAt('/doctor/dashboard', makeStore());

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('sends an anonymous visitor to /login', () => {
    renderAt('/doctor/dashboard', signedOut());

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Doctor area')).not.toBeInTheDocument();
  });

  it('lets a doctor into a doctor-only page', () => {
    renderAt('/doctor/dashboard', signedIn('DOCTOR'));

    expect(screen.getByText('Doctor area')).toBeInTheDocument();
  });

  it('sends a patient who opens a doctor page to /403', () => {
    renderAt('/doctor/dashboard', signedIn('PATIENT'));

    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
    expect(screen.queryByText('Doctor area')).not.toBeInTheDocument();
  });

  it('sends an admin away from a doctor page as well', () => {
    renderAt('/doctor/dashboard', signedIn('ADMIN'));

    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
  });
});
