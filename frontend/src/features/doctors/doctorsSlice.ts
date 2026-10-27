import { createSlice } from '@reduxjs/toolkit';
import { doctorApi } from '../../services/doctor.api';
import { createApiThunk } from '../../store/createApiThunk';
import type { DoctorProfile, PageMeta } from '../../types';

export interface DoctorFilters {
  search: string;
  specialization: string;
  page: number;
  limit: number;
}

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface DoctorsState {
  filters: DoctorFilters;
  items: DoctorProfile[];
  meta: PageMeta | null;
  status: LoadStatus;
  error: string | null;
  /** Only the newest search may write results, so a slow early response cannot overwrite a newer one. */
  requestId: string | null;
  selected: DoctorProfile | null;
  selectedStatus: LoadStatus;
  selectedError: string | null;
}

const initialState: DoctorsState = {
  filters: { search: '', specialization: '', page: 1, limit: 8 },
  items: [],
  meta: null,
  status: 'idle',
  error: null,
  requestId: null,
  selected: null,
  selectedStatus: 'idle',
  selectedError: null,
};

export const searchDoctors = createApiThunk('doctors/search', (filters: DoctorFilters) => doctorApi.search(filters));
export const fetchDoctor = createApiThunk('doctors/fetchOne', (id: number) => doctorApi.get(id));

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchDoctors.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.filters = action.meta.arg;
        state.requestId = action.meta.requestId;
      })
      .addCase(searchDoctors.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.requestId) return;
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(searchDoctors.rejected, (state, action) => {
        if (action.meta.requestId !== state.requestId) return;
        state.status = 'failed';
        state.error = action.payload?.message ?? 'Could not load doctors';
      })
      .addCase(fetchDoctor.pending, (state) => {
        state.selectedStatus = 'loading';
        state.selectedError = null;
        state.selected = null;
      })
      .addCase(fetchDoctor.fulfilled, (state, action) => {
        state.selectedStatus = 'succeeded';
        state.selected = action.payload;
      })
      .addCase(fetchDoctor.rejected, (state, action) => {
        state.selectedStatus = 'failed';
        state.selectedError = action.payload?.message ?? 'Could not load this doctor';
      });
  },
});

export default doctorsSlice.reducer;
