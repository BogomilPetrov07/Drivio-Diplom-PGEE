import crypto from 'crypto';
import {prisma} from "../../config/prisma.js";
import {Role} from "@genprisma/client";
import {compare, hash} from "../../utils/password.js";
import {v4 as uuid4} from "uuid";
import {sendWelcomeEmailReact} from "../../utils/email";

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
        const tokenId = uuid4()
        const hashedValue = crypto.createHash("sha256").update(tokenValue + tokenId).digest("hex");
        // Save token to DB with device info
        const token = await prisma.refreshToken.create({
            data: {
                id: tokenId, tokenHash: hashedValue, sessionId: sessionId
            }
        });
        return {token, tokenId, tokenValue};
    }

    static async rotateRefreshToken(tokenId: string, tokenValue: string) {
        const refreshTokenRecord = await prisma.refreshToken.findUnique({
            where: {
                id: tokenId,
                revoked: false
            },
            include: {
                session: true
            }
        });
        if (!refreshTokenRecord || refreshTokenRecord.session.revoked === true) return null;

        const isMatched = this.generateHash(tokenValue, refreshTokenRecord.id) === refreshTokenRecord.tokenHash

        if (!isMatched) return null;

        const newRefreshToken = await this.createRefreshToken(refreshTokenRecord.sessionId);
        await prisma.refreshToken.update(
            {
                where: {id: tokenId},
                data: {revoked: true, replaceTokenId: newRefreshToken.token.id, replacedAt: new Date()}
            });

        return newRefreshToken;
    }

    static async createSession(userId: string, userAgent: string, ip: string) {
        return prisma.session.create({
            data: {
                userId: userId, deviceName: userAgent, ip: ip
            }
        });
    }

    static async register(username: string, password: string, role: string, email: string) {
        const hashedPassword = await hash(password);
        return prisma.user.create({
            data: {
                username, email, password: hashedPassword, role: role as Role
            }
        });
    }

    static async logout(sessionId: string) {
        await prisma.session.update({where: {id: sessionId}, data: {revoked: true}});
        await prisma.refreshToken.updateMany({where: {sessionId}, data: {revoked: true}});
    }

    static async sendEmail(email: string, username: string) {
        return sendWelcomeEmailReact(email, username);
    }

    private static generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    private static generateHash = (plainToken: string, salt: string) => {
        return crypto.createHash('sha256').update(plainToken + salt).digest('hex');
    }
}
