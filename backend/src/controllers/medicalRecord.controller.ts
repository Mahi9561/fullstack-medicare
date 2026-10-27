import { medicalRecordService } from '../services/medicalRecord.service';
import { getActor } from '../utils/actor';
import { sendCreated } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const medicalRecordController = {
  create: asyncHandler(async (req, res) => {
    sendCreated(res, await medicalRecordService.create(getActor(req), req.body), 'Medical record added');
  }),
};
