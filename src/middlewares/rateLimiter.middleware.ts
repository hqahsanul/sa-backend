import { NextFunction, Request, Response } from 'express';

type RateLimiterFactory = () => (req: Request, res: Response, next: NextFunction) => void;

const noopRateLimiter: RateLimiterFactory = () => (_req, _res, next) => {
  next();
};

export const RateLimiterMiddleware = {
  auth: noopRateLimiter,
  otp: noopRateLimiter,
};

