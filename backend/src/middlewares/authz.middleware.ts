import {NextFunction, Request, Response} from "express";
import {roleEnum} from "../../drizzle/schemas/enums.js";


type Role = typeof roleEnum.enumValues[number];

export function authorizeMiddleware(roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({message: "Unauthorized: No user found"});
        }

        if (!roles.includes(req.user.role as Role)) {
            return res.status(403).json({message: "Forbidden: Access denied"});
        }

        next();
    };
}