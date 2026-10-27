import { doctorService } from '../services/doctor.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { SearchPageQuery } from '../validators/common';
import type { ListDoctorsQuery, SlotsQuery } from '../validators/doctor.validator';

export const doctorController = {
  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await doctorService.list(queryOf<ListDoctorsQuery>(req)));
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.getById(idParam(req)));
  }),

  getAvailability: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.getAvailability(getActor(req), idParam(req)));
  }),

  getSlots: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.getSlots(idParam(req), queryOf<SlotsQuery>(req).date));
  }),

  getProfile: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.getProfile(getActor(req)));
  }),

  updateProfile: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.updateProfile(getActor(req), req.body), 'Profile updated');
  }),

  replaceAvailability: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.replaceAvailability(getActor(req), req.body), 'Availability saved');
  }),

  dashboard: asyncHandler(async (req, res) => {
    sendSuccess(res, await doctorService.dashboard(getActor(req)));
  }),

  listPatients: asyncHandler(async (req, res) => {
    sendPaginated(res, await doctorService.listPatients(getActor(req), queryOf<SearchPageQuery>(req)));
  }),
};
