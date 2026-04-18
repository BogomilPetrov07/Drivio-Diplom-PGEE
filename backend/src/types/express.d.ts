import { roleEnum } from "../../drizzle/schemas/enums.js";

type Role = typeof roleEnum.enumValues[number];

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface User {
  id: string;
  role: Role;
  roles: Role[];
  activeRole: Role;
  sessionId: string;
}
