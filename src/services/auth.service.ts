import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { securityConfig } from '../config';
import { store } from '../store/in-memory.store';
import {
  AuthTokenPayload,
  DoctorAvailability,
  DoctorUser,
  PatientUser,
  User,
  UserRole,
} from '../types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

const SALT_ROUNDS = 10;

export function toAuthTokenPayload(user: User): AuthTokenPayload {
  return {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

export async function register(input: RegisterInput): Promise<User> {
  const { name, email, password, role } = input;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = store.getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  if (role !== 'PATIENT' && role !== 'DOCTOR') {
    throw new Error('Invalid user role');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const baseUser = {
    id: uuid(),
    name: name.trim(),
    email: normalizedEmail,
    role,
    passwordHash,
    createdAt: new Date(),
  };

  let user: User;
  if (role === 'DOCTOR') {
    user = {
      ...baseUser,
      availability: 'ONLINE',
    } as DoctorUser;
  } else {
    user = baseUser as PatientUser;
  }

  store.addUser(user);
  return user;
}

export async function login(input: LoginInput): Promise<User> {
  const { email, password } = input;
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.getUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const updatedUser = {
    ...user,
    lastLoginAt: new Date(),
  };

  store.updateUser(updatedUser);
  return updatedUser;
}

export function createAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, securityConfig.jwtSecret, {
    expiresIn: securityConfig.tokenExpirySeconds,
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, securityConfig.jwtSecret) as AuthTokenPayload;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

export function setDoctorAvailability(
  doctorId: string,
  availability: DoctorAvailability,
): DoctorUser {
  return store.setDoctorAvailability(doctorId, availability);
}

