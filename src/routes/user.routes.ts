import { Router } from 'express';

import { listUsers } from '../controllers/user.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', AuthMiddleware.authenticate, listUsers);

export default router;

