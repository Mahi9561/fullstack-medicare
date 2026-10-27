import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  bookAppointmentBody,
  cancelAppointmentBody,
  listAppointmentsQuery,
  vitalSignsBody,
} from '../validators/appointment.validator';
import { idParams } from '../validators/common';

const router = Router();
router.use(authenticateUser);

router.post('/', authorizeRole('PATIENT'), validate({ body: bookAppointmentBody }), appointmentController.book);
router.get('/', authorizeRole('PATIENT', 'DOCTOR'), validate({ query: listAppointmentsQuery }), appointmentController.list);
router.get('/:id', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams }), appointmentController.getById);

router.patch('/:id/confirm', authorizeRole('DOCTOR'), validate({ params: idParams }), appointmentController.confirm);
router.patch('/:id/cancel', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams, body: cancelAppointmentBody }), appointmentController.cancel);
router.patch('/:id/complete', authorizeRole('DOCTOR'), validate({ params: idParams }), appointmentController.complete);
router.patch('/:id/no-show', authorizeRole('DOCTOR'), validate({ params: idParams }), appointmentController.markNoShow);

router.put('/:id/vital-signs', authorizeRole('DOCTOR'), validate({ params: idParams, body: vitalSignsBody }), appointmentController.upsertVitals);
router.get('/:id/vital-signs', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams }), appointmentController.getVitals);

export default router;
