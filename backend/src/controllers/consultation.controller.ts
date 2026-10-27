import { consultationService } from '../services/consultation.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { PageQuery } from '../validators/common';

export const consultationController = {
  create: asyncHandler(async (req, res) => {
    sendCreated(res, await consultationService.create(getActor(req), req.body), 'Consultation saved and appointment completed');
  }),

  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await consultationService.list(getActor(req), queryOf<PageQuery>(req)));
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await consultationService.getById(getActor(req), idParam(req)));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await consultationService.update(getActor(req), idParam(req), req.body), 'Consultation updated');
  }),
};
