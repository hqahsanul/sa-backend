import { store } from '../store/in-memory.store';
import { DoctorAvailability, DoctorUser, PublicUserProfile, User } from '../types';

export function getPublicUsers(): PublicUserProfile[] {
  return store.toPublicProfiles();
}

export function getDoctors(filter?: { availability?: DoctorAvailability }): DoctorUser[] {
  const doctors = store.listDoctors();

  if (filter?.availability) {
    return doctors.filter((doctor) => doctor.availability === filter.availability);
  }

  return doctors;
}

export function getUserById(userId: string): User | undefined {
  return store.getUserById(userId);
}

