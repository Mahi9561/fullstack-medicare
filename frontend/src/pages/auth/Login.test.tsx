import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/apiClient';
import { authApi } from '../../services/auth.api';
import { makeStore } from '../../store/store';
import type { Session } from '../../types';
import Login from './Login';

vi.mock('../../services/auth.api', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));

const session: Session = {
  user: { id: 1, email: 'patient1@medicare.local', role: 'PATIENT', status: 'ACTIVE' },
  profile: null,
};

const renderLogin = () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

const fillAndSubmit = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

beforeEach(() => {
  vi.mocked(authApi.login).mockReset();
});

describe('Login page', () => {
  it('asks for both fields and does not call the API when the form is empty', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('rejects a malformed email before calling the API', async () => {
    renderLogin();

    await fillAndSubmit('not-an-email', 'Whatever1');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('signs in with the typed credentials', async () => {
    vi.mocked(authApi.login).mockResolvedValue(session);
    const store = renderLogin();

    await fillAndSubmit('patient1@medicare.local', 'Patient@123');

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
    expect(authApi.login).toHaveBeenCalledWith({ email: 'patient1@medicare.local', password: 'Patient@123' });
    expect(store.getState().user.user?.role).toBe('PATIENT');
  });

  it('shows the server message for a wrong password and stays signed out', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError('Invalid email or password', 401));
    const store = renderLogin();

    await fillAndSubmit('patient1@medicare.local', 'WrongPass1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(store.getState().auth.status).not.toBe('authenticated');
  });
});
