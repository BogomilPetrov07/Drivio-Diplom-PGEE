import {Role} from "@prisma/client";

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
    sessionId: string;
}