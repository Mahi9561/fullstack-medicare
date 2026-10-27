import { patientService } from '../services/patient.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { PageQuery } from '../validators/common';

export const patientController = {
  getProfile: asyncHandler(async (req, res) => {
    sendSuccess(res, await patientService.getProfile(getActor(req)));
  }),

  updateProfile: asyncHandler(async (req, res) => {
    sendSuccess(res, await patientService.updateProfile(getActor(req), req.body), 'Profile updated');
  }),

  dashboard: asyncHandler(async (req, res) => {
    sendSuccess(res, await patientService.dashboard(getActor(req)));
  }),

  listConsultations: asyncHandler(async (req, res) => {
    sendPaginated(res, await patientService.listConsultations(getActor(req), queryOf<PageQuery>(req)));
  }),

  listPrescriptions: asyncHandler(async (req, res) => {
    sendPaginated(res, await patientService.listPrescriptions(getActor(req), queryOf<PageQuery>(req)));
  }),

  listMedicalRecords: asyncHandler(async (req, res) => {
    sendPaginated(res, await patientService.listMedicalRecords(getActor(req), queryOf<PageQuery>(req)));
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await patientService.getById(getActor(req), idParam(req)));
  }),

  getHistory: asyncHandler(async (req, res) => {
    sendSuccess(res, await patientService.getHistory(getActor(req), idParam(req)));
  }),
};
