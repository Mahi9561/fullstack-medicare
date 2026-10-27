import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { adminAppointmentsQuery, createDoctorBody, doctorStatusBody, reportsQuery, updateDoctorBody } from '../validators/admin.validator';
import { idParams, searchPageQuery } from '../validators/common';

const router = Router();
router.use(authenticateUser, authorizeRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/reports', validate({ query: reportsQuery }), adminController.reports);

router.get('/doctors', validate({ query: searchPageQuery }), adminController.listDoctors);
router.post('/doctors', validate({ body: createDoctorBody }), adminController.createDoctor);
router.put('/doctors/:id', validate({ params: idParams, body: updateDoctorBody }), adminController.updateDoctor);
router.patch('/doctors/:id/status', validate({ params: idParams, body: doctorStatusBody }), adminController.setDoctorStatus);

router.get('/patients', validate({ query: searchPageQuery }), adminController.listPatients);
router.get('/appointments', validate({ query: adminAppointmentsQuery }), adminController.listAppointments);

export default router;
