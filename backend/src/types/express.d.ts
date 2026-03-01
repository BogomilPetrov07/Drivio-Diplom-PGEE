import { roleEnum } from "../../drizzle/schemas/enums.js";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

interface User {
    id: string;
    role: roleEnum;
    sessionId: string;
}