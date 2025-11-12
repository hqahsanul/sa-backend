import { DoctorAvailability, DoctorUser, PublicUserProfile, User } from '../types';

class InMemoryStore {
  private usersById = new Map<string, User>();
  private usersByEmail = new Map<string, User>();
  private connectedUserIds = new Set<string>();

  addUser(user: User): void {
    if (this.usersByEmail.has(user.email)) {
      throw new Error('Email already registered');
    }
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }

  getUserByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email);
  }

  getUserById(userId: string): User | undefined {
    return this.usersById.get(userId);
  }

  updateUser(user: User): void {
    if (!this.usersById.has(user.id)) {
      throw new Error('User not found');
    }
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }

  listUsers(): User[] {
    return Array.from(this.usersById.values());
  }

  listDoctors(): DoctorUser[] {
    const allUsers = this.listUsers();
    return allUsers.filter((user): user is DoctorUser => user.role === 'DOCTOR');
  }

  markConnected(userId: string): void {
    this.connectedUserIds.add(userId);
  }

  markDisconnected(userId: string): void {
    this.connectedUserIds.delete(userId);
  }

  isConnected(userId: string): boolean {
    return this.connectedUserIds.has(userId);
  }

  setDoctorAvailability(userId: string, availability: DoctorAvailability): DoctorUser {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('Doctor not found');
    }
    if (user.role !== 'DOCTOR') {
      throw new Error('Doctor not found');
    }

    const updatedDoctor: DoctorUser = { ...user, availability };
    this.updateUser(updatedDoctor);
    return updatedDoctor;
  }

  toPublicProfiles(): PublicUserProfile[] {
    return this.listUsers().map((user) => {
      const profile: PublicUserProfile = {
        id: user.id,
        name: user.name,
        role: user.role,
        connected: this.isConnected(user.id),
      };

      if (user.role === 'DOCTOR') {
        profile.availability = (user as DoctorUser).availability;
      }

      return profile;
    });
  }
}

export const store = new InMemoryStore();

