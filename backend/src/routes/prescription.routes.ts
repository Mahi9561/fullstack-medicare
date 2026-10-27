import { Router } from 'express';
import { prescriptionController } from '../controllers/prescription.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createPrescriptionBody, listPrescriptionsQuery, updatePrescriptionBody } from '../validators/prescription.validator';

const router = Router();
router.use(authenticateUser);

router.post('/', authorizeRole('DOCTOR'), validate({ body: createPrescriptionBody }), prescriptionController.create);
router.get('/', authorizeRole('DOCTOR'), validate({ query: listPrescriptionsQuery }), prescriptionController.list);
router.get('/:id', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams }), prescriptionController.getById);
router.put('/:id', authorizeRole('DOCTOR'), validate({ params: idParams, body: updatePrescriptionBody }), prescriptionController.update);

export default router;
