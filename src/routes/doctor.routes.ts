import { Router } from 'express';

import { listDoctors, updateDoctorStatus } from '../controllers/doctor.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RateLimiterMiddleware } from '../middlewares/rateLimiter.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { DoctorValidator } from '../validators/doctor.validator';

const router = Router();

router.get(
  '/',
  AuthMiddleware.authenticate,
  listDoctors,
);

router.post(
  '/status',
  RateLimiterMiddleware.auth(),
  AuthMiddleware.authenticate,
  AuthMiddleware.doctorOnly,
  ValidationMiddleware.validate(DoctorValidator.updateStatus()),
  updateDoctorStatus,
);

export default router;

