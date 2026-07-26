export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  CLIENT = "CLIENT",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  twoFactorEnabled: boolean;
  role: Role;
  image: string;
  lastLoginAt: string;
  createdAt: Date;
  updatedAt: Date;
}
