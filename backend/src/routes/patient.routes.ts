import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller';
import { patientController } from '../controllers/patient.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { listAppointmentsQuery } from '../validators/appointment.validator';
import { idParams, pageQuery } from '../validators/common';
import { updatePatientProfileBody } from '../validators/patient.validator';

const router = Router();
router.use(authenticateUser);

router.get('/profile', authorizeRole('PATIENT'), patientController.getProfile);
router.put('/profile', authorizeRole('PATIENT'), validate({ body: updatePatientProfileBody }), patientController.updateProfile);
router.get('/dashboard', authorizeRole('PATIENT'), patientController.dashboard);
// Alias of GET /api/appointments, kept because the page spec groups it under the patient module.
router.get('/appointments', authorizeRole('PATIENT'), validate({ query: listAppointmentsQuery }), appointmentController.list);
router.get('/consultations', authorizeRole('PATIENT'), validate({ query: pageQuery }), patientController.listConsultations);
router.get('/prescriptions', authorizeRole('PATIENT'), validate({ query: pageQuery }), patientController.listPrescriptions);
router.get('/medical-records', authorizeRole('PATIENT'), validate({ query: pageQuery }), patientController.listMedicalRecords);

router.get('/:id', authorizeRole('DOCTOR', 'ADMIN'), validate({ params: idParams }), patientController.getById);
router.get('/:id/history', authorizeRole('DOCTOR'), validate({ params: idParams }), patientController.getHistory);

export default router;
