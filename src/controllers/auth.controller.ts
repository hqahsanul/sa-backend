import { Request, Response, NextFunction } from 'express';
import {
  createAccessToken,
  login as loginService,
  register as registerService,
  toAuthTokenPayload,
} from '../services/auth.service';
import { notifyUserListChanged } from '../sockets/notifier';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await registerService({ name, email, password, role });
    const token = createAccessToken(toAuthTokenPayload(user));

    notifyUserListChanged();

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'DOCTOR' && { availability: user.availability }),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await loginService({ email, password });
    const token = createAccessToken(toAuthTokenPayload(user));

    const userResponse: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.role === 'DOCTOR') {
      userResponse.availability = user.availability;
    }

    res.status(200).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
};

