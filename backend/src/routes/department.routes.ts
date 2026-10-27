import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { departmentBody } from '../validators/department.validator';
import { activeStatusBody } from '../validators/medication.validator';

const router = Router();
router.use(authenticateUser);

router.get('/', departmentController.list);
router.post('/', authorizeRole('ADMIN'), validate({ body: departmentBody }), departmentController.create);
router.put('/:id', authorizeRole('ADMIN'), validate({ params: idParams, body: departmentBody }), departmentController.update);
router.patch('/:id/status', authorizeRole('ADMIN'), validate({ params: idParams, body: activeStatusBody }), departmentController.setActive);

export default router;
