import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { doctorApi, type DoctorProfileInput } from '../../services/doctor.api';
import { patientApi, type PatientProfileInput } from '../../services/patient.api';
import { createApiThunk } from '../../store/createApiThunk';
import type { DoctorProfile, PatientProfile, SessionUser } from '../../types';
import { bootstrapSession, login, logout, sessionExpired } from '../auth/authSlice';

interface UserState {
  user: SessionUser | null;
  profile: PatientProfile | DoctorProfile | null;
}

const initialState: UserState = { user: null, profile: null };

export const updatePatientProfile = createApiThunk('user/updatePatientProfile', (input: PatientProfileInput) =>
  patientApi.updateProfile(input),
);
export const updateDoctorProfile = createApiThunk('user/updateDoctorProfile', (input: DoctorProfileInput) =>
  doctorApi.updateProfile(input),
);

/**
 * "Who is signed in" lives here, apart from the auth slice's "is there a session", so editing a
 * profile never makes the route guards re-evaluate.
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(isAnyOf(bootstrapSession.fulfilled, login.fulfilled), (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
      })
      .addMatcher(isAnyOf(logout.fulfilled, bootstrapSession.rejected, sessionExpired), (state) => {
        state.user = null;
        state.profile = null;
      })
      .addMatcher(isAnyOf(updatePatientProfile.fulfilled, updateDoctorProfile.fulfilled), (state, action) => {
        state.profile = action.payload;
      });
  },
});

export default userSlice.reducer;
