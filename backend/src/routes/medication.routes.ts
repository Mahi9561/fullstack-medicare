import { Router } from 'express';
import { medicationController } from '../controllers/medication.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { activeStatusBody, listMedicationsQuery, medicationBody } from '../validators/medication.validator';

const router = Router();
router.use(authenticateUser);

router.get('/', authorizeRole('DOCTOR', 'ADMIN'), validate({ query: listMedicationsQuery }), medicationController.list);
router.post('/', authorizeRole('ADMIN'), validate({ body: medicationBody }), medicationController.create);
router.put('/:id', authorizeRole('ADMIN'), validate({ params: idParams, body: medicationBody }), medicationController.update);
router.patch('/:id/status', authorizeRole('ADMIN'), validate({ params: idParams, body: activeStatusBody }), medicationController.setActive);

export default router;
