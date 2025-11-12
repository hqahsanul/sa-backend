export type UserRole = 'PATIENT' | 'DOCTOR';

export type DoctorAvailability = 'ONLINE' | 'BUSY';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface PatientUser extends BaseUser {
  role: 'PATIENT';
}

export interface DoctorUser extends BaseUser {
  role: 'DOCTOR';
  availability: DoctorAvailability;
}

export type User = PatientUser | DoctorUser;

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  role: UserRole;
  availability?: DoctorAvailability;
  connected: boolean;
}

export type ClientMessage =
  | {
      type: 'chat';
      to: string;
      message: string;
    }
  | {
      type: 'webrtc-offer';
      to: string;
      payload: unknown;
    }
  | {
      type: 'webrtc-answer';
      to: string;
      payload: unknown;
    }
  | {
      type: 'webrtc-ice-candidate';
      to: string;
      payload: unknown;
    }
  | {
      type: 'call-initiate';
      to: string;
    }
  | {
      type: 'call-accept';
      to: string;
    }
  | {
      type: 'call-reject';
      to: string;
    }
  | {
      type: 'call-end';
      to: string;
    };

export type ServerMessage =
  | {
      type: 'users-update';
      users: PublicUserProfile[];
    }
  | {
      type: 'chat';
      from: string;
      message: string;
      sentAt: string;
    }
  | {
      type: 'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice-candidate';
      from: string;
      payload: unknown;
    }
  | {
      type: 'call-initiate' | 'call-accept' | 'call-reject' | 'call-end';
      from: string;
    }
  | {
      type: 'error';
      message: string;
      context?: string;
    };

