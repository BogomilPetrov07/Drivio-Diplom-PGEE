import {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "../utils/jwt.js";
import {JwtPayload} from "jsonwebtoken";
import {prisma} from "../config/prisma";

export async function authnMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Get token from the Authorization header (Bearer token)
    // instead of cookies, since login sends it in JSON
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(404);

    try {
        const decoded = verifyAccessToken(token) as JwtPayload;

        if (!decoded) return res.sendStatus(401);

        const session = await prisma.session.findUnique({where: decoded.sessionId});
        if (!session) return res.sendStatus(401);
        if (session.revoked) return res.sendStatus(401);
        // 2. Map the decoded payload to your User type structure
        req.user = {
            id: decoded.userId, role: decoded.role
        };

        next();
    } catch {
        res.sendStatus(401);
    }
}