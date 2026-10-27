import { adminService } from '../services/admin.service';
import { getActor, idParam, queryOf } from '../utils/actor';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AdminAppointmentsQuery, ReportsQuery } from '../validators/admin.validator';
import type { SearchPageQuery } from '../validators/common';

export const adminController = {
  dashboard: asyncHandler(async (_req, res) => {
    sendSuccess(res, await adminService.dashboard());
  }),

  reports: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminService.reports(queryOf<ReportsQuery>(req)));
  }),

  listDoctors: asyncHandler(async (req, res) => {
    sendPaginated(res, await adminService.listDoctors(queryOf<SearchPageQuery>(req)));
  }),

  createDoctor: asyncHandler(async (req, res) => {
    sendCreated(res, await adminService.createDoctor(getActor(req), req.body), 'Doctor account created');
  }),

  updateDoctor: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminService.updateDoctor(getActor(req), idParam(req), req.body), 'Doctor updated');
  }),

  setDoctorStatus: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminService.setDoctorStatus(getActor(req), idParam(req), req.body), 'Doctor status updated');
  }),

  listPatients: asyncHandler(async (req, res) => {
    sendPaginated(res, await adminService.listPatients(queryOf<SearchPageQuery>(req)));
  }),

  listAppointments: asyncHandler(async (req, res) => {
    sendPaginated(res, await adminService.listAppointments(queryOf<AdminAppointmentsQuery>(req)));
  }),
};
