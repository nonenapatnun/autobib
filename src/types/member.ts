export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'suspended';

export interface UserMember {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  department?: string;
  note?: string;
  bibliographyCount?: number;
}
