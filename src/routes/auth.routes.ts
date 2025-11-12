import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { RateLimiterMiddleware } from '../middlewares/rateLimiter.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { AuthValidator } from '../validators/auth.validator';

const router = Router();

router.post(
  '/register',
  RateLimiterMiddleware.auth(),
  ValidationMiddleware.validate(AuthValidator.register()),
  authController.register,
);

router.post(
  '/login',
  RateLimiterMiddleware.auth(),
  ValidationMiddleware.validate(AuthValidator.login()),
  authController.login,
);

router.post('/logout', AuthMiddleware.authenticate, (_req, res) => {
  res.status(204).send();
});

export default router;

