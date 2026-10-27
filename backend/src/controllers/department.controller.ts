import { departmentService } from '../services/department.service';
import { getActor, idParam } from '../utils/actor';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const departmentController = {
  list: asyncHandler(async (req, res) => {
    sendSuccess(res, await departmentService.list(getActor(req)));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await departmentService.create(getActor(req), req.body), 'Department added');
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await departmentService.update(getActor(req), idParam(req), req.body), 'Department updated');
  }),

  setActive: asyncHandler(async (req, res) => {
    sendSuccess(res, await departmentService.setActive(getActor(req), idParam(req), req.body), 'Department status updated');
  }),
};
