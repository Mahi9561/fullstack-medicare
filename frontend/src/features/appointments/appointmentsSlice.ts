import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import {
  appointmentApi,
  type AppointmentListParams,
  type BookAppointmentInput,
} from '../../services/appointment.api';
import { createApiThunk } from '../../store/createApiThunk';
import type { Appointment, PageMeta } from '../../types';
import { logout, sessionExpired } from '../auth/authSlice';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AppointmentsState {
  items: Appointment[];
  meta: PageMeta | null;
  status: LoadStatus;
  error: string | null;
  requestId: string | null;
  lastBooked: Appointment | null;
}

const initialState: AppointmentsState = {
  items: [],
  meta: null,
  status: 'idle',
  error: null,
  requestId: null,
  lastBooked: null,
};

export const fetchAppointments = createApiThunk('appointments/fetch', (params: AppointmentListParams) =>
  appointmentApi.list(params),
);
export const bookAppointment = createApiThunk('appointments/book', (input: BookAppointmentInput) =>
  appointmentApi.book(input),
);
export const confirmAppointment = createApiThunk('appointments/confirm', (id: number) => appointmentApi.confirm(id));
export const completeAppointment = createApiThunk('appointments/complete', (id: number) => appointmentApi.complete(id));
export const markNoShow = createApiThunk('appointments/noShow', (id: number) => appointmentApi.markNoShow(id));
export const cancelAppointment = createApiThunk('appointments/cancel', (arg: { id: number; reason: string | null }) =>
  appointmentApi.cancel(arg.id, arg.reason),
);

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.requestId) return;
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        if (action.meta.requestId !== state.requestId) return;
        state.status = 'failed';
        state.error = action.payload?.message ?? 'Could not load appointments';
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.lastBooked = action.payload;
      })
      // Every status change returns the updated appointment: swap it into the list in place.
      .addMatcher(
        isAnyOf(confirmAppointment.fulfilled, completeAppointment.fulfilled, markNoShow.fulfilled, cancelAppointment.fulfilled),
        (state, action) => {
          const index = state.items.findIndex((item) => item.id === action.payload.id);
          if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
        },
      )
      .addMatcher(isAnyOf(logout.fulfilled, sessionExpired), () => initialState);
  },
});

export default appointmentsSlice.reducer;
