import { NextFunction, Request, Response } from 'express';

type ValidationResult = {
  valid: boolean;
  errors?: string[];
};

export type RequestValidator = (req: Request) => ValidationResult;

export class ValidationMiddleware {
  static validate(validator: RequestValidator) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = validator(req);
      if (!result.valid) {
        res.status(400).json({
          message: 'Validation failed',
          errors: result.errors ?? ['Invalid payload'],
        });
        return;
      }
      next();
    };
  }
}

