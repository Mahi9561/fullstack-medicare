import { prescriptionService } from '../services/prescription.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { PageQuery } from '../validators/common';

export const prescriptionController = {
  create: asyncHandler(async (req, res) => {
    sendCreated(res, await prescriptionService.create(getActor(req), req.body), 'Prescription created');
  }),

  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await prescriptionService.list(getActor(req), queryOf<PageQuery>(req)));
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await prescriptionService.getById(getActor(req), idParam(req)));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await prescriptionService.update(getActor(req), idParam(req), req.body), 'Prescription updated');
  }),
};
