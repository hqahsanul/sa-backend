import { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../services/auth.service';
import { AuthTokenPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

function extractToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      res.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireDoctor(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'DOCTOR') {
    res.status(403).json({ message: 'Doctor role required' });
    return;
  }

  next();
}

export class AuthMiddleware {
  static authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    requireAuth(req, res, next);
  }

  static doctorOnly(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    requireDoctor(req, res, next);
  }
}

