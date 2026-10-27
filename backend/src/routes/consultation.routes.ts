import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createConsultationBody, listConsultationsQuery, updateConsultationBody } from '../validators/consultation.validator';

const router = Router();
router.use(authenticateUser);

router.post('/', authorizeRole('DOCTOR'), validate({ body: createConsultationBody }), consultationController.create);
router.get('/', authorizeRole('DOCTOR'), validate({ query: listConsultationsQuery }), consultationController.list);
router.get('/:id', authorizeRole('PATIENT', 'DOCTOR'), validate({ params: idParams }), consultationController.getById);
router.put('/:id', authorizeRole('DOCTOR'), validate({ params: idParams, body: updateConsultationBody }), consultationController.update);

export default router;
