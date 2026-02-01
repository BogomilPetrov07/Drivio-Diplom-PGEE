import {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "../utils/jwt.js";
import {Role} from "@prisma/client";

export async function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Get token from the HttpOnly cookie
    const token = req.cookies["accessToken"];

    if (!token) return res.sendStatus(404);

    try {
        const {isValid, userId, role, sessionId} = await verifyAccessToken(token);
        if (!isValid) return res.sendStatus(401);

        // 2. Map the decoded payload to your User type structure
        req.user = {
            id: userId!, role: role as Role, sessionId: sessionId!
        };

        next();
    } catch {
        res.sendStatus(401);
    }
}