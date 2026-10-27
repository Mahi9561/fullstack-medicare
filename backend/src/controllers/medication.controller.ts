import { medicationService } from '../services/medication.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListMedicationsQuery } from '../validators/medication.validator';

export const medicationController = {
  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await medicationService.list(getActor(req), queryOf<ListMedicationsQuery>(req)));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await medicationService.create(getActor(req), req.body), 'Medication added');
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await medicationService.update(getActor(req), idParam(req), req.body), 'Medication updated');
  }),

  setActive: asyncHandler(async (req, res) => {
    sendSuccess(res, await medicationService.setActive(getActor(req), idParam(req), req.body), 'Medication status updated');
  }),
};
