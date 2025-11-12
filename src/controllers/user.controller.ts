import { Request, Response, NextFunction } from 'express';
import { getPublicUsers } from '../services/user.service';

export const listUsers = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = getPublicUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

