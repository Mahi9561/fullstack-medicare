import { appointmentService } from '../services/appointment.service';
import { vitalSignService } from '../services/vitalSign.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListAppointmentsQuery } from '../validators/appointment.validator';

export const appointmentController = {
  book: asyncHandler(async (req, res) => {
    sendCreated(res, await appointmentService.book(getActor(req), req.body), 'Appointment booked');
  }),

  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await appointmentService.list(getActor(req), queryOf<ListAppointmentsQuery>(req)));
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await appointmentService.getById(getActor(req), idParam(req)));
  }),

  confirm: asyncHandler(async (req, res) => {
    sendSuccess(res, await appointmentService.confirm(getActor(req), idParam(req)), 'Appointment confirmed');
  }),

  cancel: asyncHandler(async (req, res) => {
    sendSuccess(res, await appointmentService.cancel(getActor(req), idParam(req), req.body.reason ?? null), 'Appointment cancelled');
  }),

  complete: asyncHandler(async (req, res) => {
    sendSuccess(res, await appointmentService.complete(getActor(req), idParam(req)), 'Appointment completed');
  }),

  markNoShow: asyncHandler(async (req, res) => {
    sendSuccess(res, await appointmentService.markNoShow(getActor(req), idParam(req)), 'Appointment marked as no-show');
  }),

  upsertVitals: asyncHandler(async (req, res) => {
    const { vitals, created } = await vitalSignService.upsert(getActor(req), idParam(req), req.body);
    if (created) sendCreated(res, vitals, 'Vital signs recorded');
    else sendSuccess(res, vitals, 'Vital signs updated');
  }),

  getVitals: asyncHandler(async (req, res) => {
    sendSuccess(res, await vitalSignService.get(getActor(req), idParam(req)));
  }),
};
