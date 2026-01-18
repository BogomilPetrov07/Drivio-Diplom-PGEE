import crypto from 'crypto';
import {prisma} from "../../config/prisma.js";
import {Role} from "@genprisma/client";
import {compare, hash} from "../../utils/password.js";
import {sendWelcomeEmailReact} from "../../utils/email";

export class AuthService {
    static async login(username: string, password: string) {
        const user = await prisma.user.findUnique({where: {username}});
        if (!user) return null;
        const ok = await compare(password, user.password);
        return ok ? user : null;
    }

    static async createRefreshToken(sessionId: string): Promise<string> {
        const refreshTokenValue = this.generateRefreshToken();
        const hashedToken = crypto.createHash("sha256").update(refreshTokenValue).digest("hex");
        // Save token to DB with device info
        await prisma.refreshToken.create({
            data: {
                tokenHash: hashedToken, sessionId: sessionId
            }
        });
        return refreshTokenValue;
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

    static async sendEmail(email: string, username: string) {
        return sendWelcomeEmailReact(email, username);
    }

    private static generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }
}
