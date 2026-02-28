import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {AuthPayload} from "../modules/auth/auth.types.js";
import {redis} from "../config/redis.js";
import {REDIS_KEYS} from '../config/redis-keys.js'

// Access Token: Signed with Private Key
export const signAccessToken = (payload: { userId: string; role: string; sessionId: string }) => {
    return jwt.sign(payload, env.JWT_PRIVATE_KEY, {
        algorithm: "ES256",
        expiresIn: "15m"
    });
};

// Verification: Always uses the Public Key
export const verifyAccessToken = async (token: string) => {
    try {
        const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ["ES256"] }) as AuthPayload;

        // HIGH PERFORMANCE CHECK: Check Upstash instead of Prisma
        const isBlacklisted = await redis.get(REDIS_KEYS.SESSION_REVOKE(decoded.sessionId));
        if (isBlacklisted) return { isValid: false };

        return {
            isValid: true,
            userId: decoded.userId,
            role: decoded.role!,
            sessionId: decoded.sessionId
        };
    } catch(err) {
        console.log(err);
        return { isValid: false };
    }
};