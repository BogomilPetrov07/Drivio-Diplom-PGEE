import {NextFunction, Request, Response} from "express";
import {REDIS_KEYS} from "../config/redis-keys.js";
import {redis} from "../config/redis.js";
import {AuthService} from "../modules/auth/auth.service.js";
import {verifyAccessToken} from "../utils/jwt.js";
import { roleEnum } from "../../drizzle/schemas/enums.js";

export async function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Get token from the HttpOnly cookie
    const token = req.cookies["accessToken"];

    if (!token) return res.sendStatus(401);

    try {
        const checkup = await verifyAccessToken(token);
        if (!checkup) return res.sendStatus(401);

        const {isValid, userId, role, roles, activeRole, sessionId} = checkup;

        if (!isValid) return res.sendStatus(401);
        if (!sessionId) return res.sendStatus(401);

        const isRevoked = await redis.get(REDIS_KEYS.SESSION_REVOKE(sessionId));
        if (isRevoked) return res.sendStatus(401);
        const sessionActive = await AuthService.isSessionActive(sessionId, userId);
        if (!sessionActive) return res.sendStatus(401);

        // 2. Map the decoded payload to your User type structure
        req.user = {
            id: userId!,
            role: role as typeof roleEnum.enumValues[number],
            roles: (roles ?? [role]) as (typeof roleEnum.enumValues[number])[],
            activeRole: (activeRole ?? role) as typeof roleEnum.enumValues[number],
            sessionId: sessionId!
        };

        next();
    } catch(error) {
        console.log(error);
        res.sendStatus(401);
    }
}
