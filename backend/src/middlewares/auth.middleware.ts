import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "@genprisma/client";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Get token from the Authorization header (Bearer token)
    // instead of cookies, since login sends it in JSON
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    try {
        const decoded = verifyAccessToken(token) as JwtPayload;

        // 2. Map the decoded payload to your User type structure
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };

        next();
    } catch {
        res.sendStatus(401);
    }
}

export function authorizeMiddleware(roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        if (!roles.includes(req.user.role as Role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }

        next();
    };
}