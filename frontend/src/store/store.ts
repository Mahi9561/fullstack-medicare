import { configureStore } from '@reduxjs/toolkit';
import appointments from '../features/appointments/appointmentsSlice';
import auth, { sessionExpired } from '../features/auth/authSlice';
import doctors from '../features/doctors/doctorsSlice';
import notifications from '../features/notifications/notificationsSlice';
import user from '../features/user/userSlice';
import { setUnauthorizedHandler } from '../services/apiClient';

export const reducer = { auth, user, appointments, doctors, notifications };

export const makeStore = () => configureStore({ reducer });

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// When any call returns 401 outside the auth endpoints, the session is gone: sign the user out locally.
setUnauthorizedHandler(() => store.dispatch(sessionExpired()));
