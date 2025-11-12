import { Request } from 'express';

import { RequestValidator } from '../middlewares/validation.middleware';

const STATUS_VALUES = new Set(['ONLINE', 'BUSY']);

const updateStatusValidator: RequestValidator = (req: Request) => {
  const { status } = req.body ?? {};
  const errors: string[] = [];

  if (typeof status !== 'string' || !STATUS_VALUES.has(status)) {
    errors.push('status must be ONLINE or BUSY');
  }

  return { valid: errors.length === 0, errors };
};

export const DoctorValidator = {
  updateStatus: (): RequestValidator => updateStatusValidator,
};

