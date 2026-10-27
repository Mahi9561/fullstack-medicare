import { Router } from 'express';
import { medicalRecordController } from '../controllers/medicalRecord.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createMedicalRecordBody } from '../validators/medicalRecord.validator';

const router = Router();
router.use(authenticateUser);

router.post('/', authorizeRole('DOCTOR'), validate({ body: createMedicalRecordBody }), medicalRecordController.create);

export default router;
