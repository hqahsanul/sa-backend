import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

import { store } from './in-memory.store';
import { DoctorAvailability, DoctorUser, PatientUser } from '../types';

const DEFAULT_PASSWORD = 'changeme123';

type SeedUser =
  | {
      id: string;
      name: string;
      email: string;
      role: 'DOCTOR';
      availability: DoctorAvailability;
    }
  | {
      id: string;
      name: string;
      email: string;
      role: 'PATIENT';
    };

const seedUsers: SeedUser[] = [
  {
    id: uuid(),
    name: 'Dr. Sushma Rao',
    email: 'doctor@sayurveda.test',
    role: 'DOCTOR',
    availability: 'ONLINE',
  },
  {
    id: uuid(),
    name: 'Ravi Sharma',
    email: 'patient@sayurveda.test',
    role: 'PATIENT',
  },
];

export function seedInitialUsers(): void {
  for (const seed of seedUsers) {
    if (store.getUserByEmail(seed.email)) {
      continue;
    }

    const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 8);
    const createdAt = new Date();

    const base = {
      id: seed.id,
      name: seed.name,
      email: seed.email,
      passwordHash,
      createdAt,
    };

    const user =
      seed.role === 'DOCTOR'
        ? ({
            ...base,
            role: seed.role,
            availability: seed.availability,
          } as DoctorUser)
        : ({
            ...base,
            role: seed.role,
          } as PatientUser);

    store.addUser(user);
  }
}

export const seededPassword = DEFAULT_PASSWORD;

