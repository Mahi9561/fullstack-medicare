import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import adminRoutes from './admin.routes';
import appointmentRoutes from './appointment.routes';
import authRoutes from './auth.routes';
import consultationRoutes from './consultation.routes';
import departmentRoutes from './department.routes';
import doctorRoutes from './doctor.routes';
import medicalRecordRoutes from './medicalRecord.routes';
import medicationRoutes from './medication.routes';
import notificationRoutes from './notification.routes';
import patientRoutes from './patient.routes';
import prescriptionRoutes from './prescription.routes';

const router = Router();

router.get('/health', healthController);
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medications', medicationRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
