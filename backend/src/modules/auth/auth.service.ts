import crypto from 'crypto';
import {prisma} from "../../config/prisma.js";
import {Role} from "@genprisma/client";
import {env} from "../../config/env.js";
import {compare, hash} from "../../utils/password.js";
import {v4 as uuid4} from "uuid";
import {sendWelcomeEmailReact} from "../../utils/email";
import {redis} from "../../config/redis";

export class AuthService {
    static async login(username: string, password: string) {
        const user = await prisma.user.findUnique({where: {username}});

        if (!user) return null;

        const {id, role, email} = user;
        const ok = await compare(password, user.password);
        return ok ? {id, username, role, email} : null;
    }

    static async createRefreshToken(sessionId: string) {
        const tokenValue = this.generateRefreshToken();
        const tokenId = uuid4();
        const hashedValue = this.generateHash(tokenValue, tokenId);

        // Calculate signature for the new record
        const signature = this.signState(tokenId, false, sessionId);

        await prisma.refreshToken.create({
            data: {
                id: tokenId,
                tokenHash: hashedValue,
                sessionId: sessionId,
                signature: signature
            }
        });
        return {tokenId, tokenValue};
    }

    static async rotateRefreshToken(tokenId: string, tokenValue: string) {
        const refreshTokenRecord = await prisma.refreshToken.findUnique({
            where: { id: tokenId },
            include: { session: true }
        });

        if (!refreshTokenRecord) return null;

        // 1. INTEGRITY CHECK: Did an attacker flip the 'revoked' in the DB?
        const expectedSignature = this.signState(
            refreshTokenRecord.id,
            refreshTokenRecord.revoked,
            refreshTokenRecord.sessionId
        );

        if (refreshTokenRecord.signature !== expectedSignature) {
            console.error("ALERT: Database tampering detected for token:", tokenId);

            await prisma.session.update({ where: { id: refreshTokenRecord.sessionId }, data: { revoked: true } });
            return null;
        }

        // 2. Logic Check: Is it revoked or session invalids?
        if (refreshTokenRecord.revoked || refreshTokenRecord.session.revoked) {
            // REUSE DETECTION: If an attacker uses a revoked token, someone stole an old one!
            if (refreshTokenRecord.revoked) {
                console.warn("Possible reuse attack! Token was already revoked.");
            }
            return null;
        }

        // 3. Hash Check
        const isMatched = this.generateHash(tokenValue, refreshTokenRecord.id) === refreshTokenRecord.tokenHash;
        if (!isMatched) return null;

        const newRefreshToken = await this.createRefreshToken(refreshTokenRecord.sessionId);

        // 4. Update the old token with a NEW signature for the 'revoked: true' state
        const revokedSignature = this.signState(tokenId, true, refreshTokenRecord.sessionId);

        await prisma.refreshToken.update({
            where: { id: tokenId },
            data: {
                revoked: true,
                replaceTokenId: newRefreshToken.tokenId,
                replacedAt: new Date(),
                signature: revokedSignature
            }
        });

        return newRefreshToken;
    }

    static async createSession(userId: string, userAgent: string, ip: string) {
        const sessionId = uuid4();

        // Calculate signature for the new record
        const signature = this.signState(sessionId, false, userId);

        await prisma.session.create({
            data: {
                id: sessionId, userId: userId, deviceName: userAgent, ip: ip, signature: signature
            }
        });

        return sessionId;
    }

    static async register(username: string, password: string, role: string, email: string) {
        const hashedPassword = await hash(password);
        return prisma.user.create({
            data: {
                username, email, password: hashedPassword, role: role as Role
            }
        });
    }

    static async logout(sessionId: string, userId: string) {
        // 1. Permanent change in DB
        const newSignature = this.signState(sessionId, true, userId);
        await prisma.session.update({where: {id: sessionId}, data: {revoked: true, signature: newSignature}});

        // 2. Immediate Blacklist in Upstash (Expires in 15 mins / 900 seconds)
        await redis.set(`revoked:${sessionId}`, "true", "EX", 900);
    }

    static sendEmail(email: string, username: string) {
        const info = sendWelcomeEmailReact(email, username);
        return info !== null;
    }

    private static signState(id: string, revoked: boolean, foreignKeyId: string) {
        const data = `${id}:${revoked}:${foreignKeyId}`;
        return crypto.createHmac('sha256', env.PEPPER).update(data).digest('hex');
    }

    private static generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    private static generateHash = (plainToken: string, salt: string) => {
        return crypto.createHash('sha256').update(plainToken + salt).digest('hex');
    }
}
