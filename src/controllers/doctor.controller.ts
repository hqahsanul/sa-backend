import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { setDoctorAvailability } from '../services/auth.service';
import { getDoctors } from '../services/user.service';
import { notifyUserListChanged } from '../sockets/notifier';
import { store } from '../store/in-memory.store';
import { DoctorAvailability } from '../types';

export const listDoctors = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { availability } = req.query;
    
    let filter: { availability: DoctorAvailability } | undefined;
    if (typeof availability === 'string') {
      const normalized = availability.toUpperCase();
      if (normalized === 'ONLINE' || normalized === 'BUSY') {
        filter = { availability: normalized as DoctorAvailability };
      }
    }

    const doctors = getDoctors(filter);

    const result = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      availability: doctor.availability,
      connected: store.isConnected(doctor.id),
    }));

    res.status(200).json({ doctors: result });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorStatus = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = (req.body ?? {}) as { status: 'ONLINE' | 'BUSY' };

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const updatedDoctor = setDoctorAvailability(req.user.sub, status);
    notifyUserListChanged();

    res.status(200).json({
      id: updatedDoctor.id,
      availability: updatedDoctor.availability,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
};

