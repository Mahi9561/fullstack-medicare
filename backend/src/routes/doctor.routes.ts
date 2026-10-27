import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParams, searchPageQuery } from '../validators/common';
import {
  listDoctorsQuery,
  replaceAvailabilityBody,
  slotsQuery,
  updateDoctorProfileBody,
} from '../validators/doctor.validator';

const router = Router();
router.use(authenticateUser);

// Fixed paths first, so "/profile" can never be read as an :id.
router.get('/', authorizeRole('PATIENT'), validate({ query: listDoctorsQuery }), doctorController.list);
router.get('/profile', authorizeRole('DOCTOR'), doctorController.getProfile);
router.put('/profile', authorizeRole('DOCTOR'), validate({ body: updateDoctorProfileBody }), doctorController.updateProfile);
router.put('/availability', authorizeRole('DOCTOR'), validate({ body: replaceAvailabilityBody }), doctorController.replaceAvailability);
router.get('/dashboard', authorizeRole('DOCTOR'), doctorController.dashboard);
router.get('/patients', authorizeRole('DOCTOR'), validate({ query: searchPageQuery }), doctorController.listPatients);

router.get('/:id', authorizeRole('PATIENT'), validate({ params: idParams }), doctorController.getById);
router.get('/:id/availability', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams }), doctorController.getAvailability);
router.get('/:id/slots', authorizeRole('PATIENT'), validate({ params: idParams, query: slotsQuery }), doctorController.getSlots);

export default router;
