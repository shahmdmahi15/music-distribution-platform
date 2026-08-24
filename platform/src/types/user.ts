export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  CLIENT = "CLIENT",
}

export interface User {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  email: string;
  twoFactorEnabled: boolean;
  role: Role;
  image: string | null;
  lastLoginAt: string | null;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}
