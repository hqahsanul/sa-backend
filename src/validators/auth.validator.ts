import { Request } from 'express';

import { RequestValidator } from '../middlewares/validation.middleware';

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function requireString(field: string, value: unknown, errors: string[], options?: { min?: number }) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${field} is required`);
    return;
  }
  if (options?.min && value.trim().length < options.min) {
    errors.push(`${field} must be at least ${options.min} characters`);
  }
}

const registerValidator: RequestValidator = (req: Request) => {
  const { name, email, password, role } = req.body ?? {};
  const errors: string[] = [];

  requireString('name', name, errors, { min: 2 });
  requireString('email', email, errors);
  requireString('password', password, errors, { min: 6 });
  requireString('role', role, errors);

  if (typeof email === 'string' && !emailRegex.test(email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (role !== 'PATIENT' && role !== 'DOCTOR') {
    errors.push('role must be PATIENT or DOCTOR');
  }

  return { valid: errors.length === 0, errors };
};

const loginValidator: RequestValidator = (req: Request) => {
  const { email, password } = req.body ?? {};
  const errors: string[] = [];

  requireString('email', email, errors);
  requireString('password', password, errors);

  if (typeof email === 'string' && !emailRegex.test(email.trim())) {
    errors.push('email must be a valid email address');
  }

  return { valid: errors.length === 0, errors };
};

export const AuthValidator = {
  register: (): RequestValidator => registerValidator,
  login: (): RequestValidator => loginValidator,
};

