import { roleEnum } from "../../../drizzle/schemas/enums.js";

export type Role = typeof roleEnum.enumValues[number];

export interface LoginDTO {
  username: string;
  password: string;
}

export interface AuthUserDTO {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  roles: Role[];
  activeRole: Role;
  hasInstructorPrivileges: boolean;
}

export interface RegisterDTO extends LoginDTO {
  role: Role;
  secondaryRole?: Role;
  email: string;
}

export interface RotateDTO {
  type: "refresh" | "session";
}

export interface SessionDTO {
  id: string;
  revoked: boolean;
  userId: string;
  signature: string | null;
}

export interface RefreshTokenDTO {
  id: string;
  revoked: boolean;
  signature: string | null;
  tokenHash: string;
}

export interface RefreshTokenCollectionItem {
  id: string;
}

export type RefreshTokenCollectionDTO = RefreshTokenCollectionItem[];

export interface AuthPayload {
  userId: string;
  role: Role;
  roles: Role[];
  activeRole: Role;
  sessionId: string;
}
