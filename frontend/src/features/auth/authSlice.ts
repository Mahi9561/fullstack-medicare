import { createSlice } from '@reduxjs/toolkit';
import { authApi, type LoginPayload } from '../../services/auth.api';
import { createApiThunk } from '../../store/createApiThunk';

export type AuthStatus = 'idle' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  loginPending: boolean;
  /** Banner-level problems only (server unreachable, session expired). Form errors stay in the form. */
  error: string | null;
}

const initialState: AuthState = { status: 'idle', loginPending: false, error: null };

/** Runs once on boot: asks the API whether the session cookie is still valid. */
export const bootstrapSession = createApiThunk('auth/bootstrap', () => authApi.me());

export const login = createApiThunk('auth/login', (payload: LoginPayload) => authApi.login(payload));

export const logout = createApiThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // If the call fails the session is unusable anyway, so the user is signed out locally either way.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.status = 'anonymous';
      state.error = 'Your session has expired. Please sign in again.';
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state) => {
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(bootstrapSession.rejected, (state, action) => {
        state.status = 'anonymous';
        // A 401 just means "not signed in". Only an unreachable server deserves a message.
        state.error = action.payload && action.payload.status === 0 ? action.payload.message : null;
      })
      .addCase(login.pending, (state) => {
        state.loginPending = true;
      })
      .addCase(login.fulfilled, (state) => {
        state.loginPending = false;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(login.rejected, (state) => {
        state.loginPending = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'anonymous';
        state.error = null;
      });
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
