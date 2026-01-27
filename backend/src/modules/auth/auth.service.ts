import crypto from 'crypto';
import {prisma} from "../../config/prisma.js";
import {Role} from "@genprisma/client";
import {env} from "../../config/env.js";
import {compare, hash} from "../../utils/password.js";
import {v4 as uuid4} from "uuid";
import {sendWelcomeEmailReact} from "../../utils/email";
import {redis} from "../../config/redis";
import {client} from "../../config/infisical";

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
                id: tokenId, tokenHash: hashedValue, sessionId: sessionId, signature: signature
            }
        });
        return {tokenId, tokenValue};
    }

    static async rotateRefreshToken(tokenId: string, tokenValue: string) {
        const records = await prisma.refreshToken.findUnique({
            where: {id: tokenId}, include: {session: true}
        });

        if (!records) return null;

        const {session: sessionRecord, ...refreshTokenRecord} = records;

        if (!refreshTokenRecord) return null;

        // 1. INTEGRITY CHECK: Did an attacker flip the 'revoked' in the DB?
        const expectedSignature = this.signState(refreshTokenRecord.id, refreshTokenRecord.revoked, refreshTokenRecord.sessionId);

        if (refreshTokenRecord.signature !== expectedSignature) {
            const expectedSignatureLegacy = this.signState(refreshTokenRecord.id, refreshTokenRecord.revoked, refreshTokenRecord.sessionId, false, false);

            if (refreshTokenRecord.signature !== expectedSignatureLegacy) {
                console.error("ALERT: Database tampering detected for token:", tokenId);

                // Session validity check
                const expectedSessionSignature = this.signState(sessionRecord.id, sessionRecord.revoked, sessionRecord.userId, true)
                if (expectedSessionSignature !== sessionRecord.signature) {
                    const expectedSessionSignatureLegacy = this.signState(sessionRecord.id, sessionRecord.revoked, sessionRecord.userId, true, false)
                    if (expectedSessionSignatureLegacy !== sessionRecord.signature) {
                        console.error("ALERT: Database tampering detected for session:", sessionRecord.id);

                        await prisma.refreshToken.updateMany({
                            where: {sessionId: sessionRecord.id},
                            data: {
                                revoked: true,
                                signature: this.signState(refreshTokenRecord.id, true, sessionRecord.id)
                            }
                        });

                        await prisma.session.update({
                            where: {id: sessionRecord.id},
                            data: {
                                revoked: true,
                                signature: this.signState(sessionRecord.id, true, sessionRecord.userId)
                            }
                        });
                    }
                }

                // Revoke the session if the refresh token is compromised
                await prisma.session.update({where: {id: refreshTokenRecord.sessionId}, data: {revoked: true}});
                return null;
            }

            // Upgrade the signature for the current refresh token
            await prisma.refreshToken.update({
                where: {id: refreshTokenRecord.id},
                data: {signature: expectedSignature}
            });
        }

        // 2. Logic Check: Is it revoked or session invalids?
        if (refreshTokenRecord.revoked || sessionRecord.revoked) {
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
            where: {id: tokenId}, data: {
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
        const signature = this.signState(sessionId, false, userId, true);

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
        const newSignature = this.signState(sessionId, true, userId, true);
        await prisma.session.update({where: {id: sessionId}, data: {revoked: true, signature: newSignature}});

        // 2. Immediate Blacklist in Upstash (Expires in 15 mins / 900 seconds)
        await redis.set(`revoked:${sessionId}`, "true", "EX", 900);
    }

    static async sendEmail(email: string, username: string) {
        const info = await sendWelcomeEmailReact(email, username);
        return info !== null;
    }

    static async rotatePepper(type: boolean) {
        const newPepper = crypto.randomBytes(32).toString("hex");

        const environment = process.env.NODE_ENV === "production" ? "prod" : "dev";
        const projectId = process.env.INFISICAL_PROJECT_ID!;

        const activeKey = type ? "PEPPER_REFRESH_ACTIVE" : "PEPPER_SESSION_ACTIVE";
        const legacyKey = type ? "PEPPER_REFRESH_LEGACY" : "PEPPER_SESSION_LEGACY";

        // 1) Fetch current active pepper from Infisical
        const activeSecret = await client.secrets().getSecret({
            projectId,
            environment,
            secretName: activeKey
        });

        if (!activeSecret?.secretValue) {
            throw new Error(`Missing current active pepper: ${activeKey}`);
        }

        // 2) Move current active -> legacy
        await client.secrets().updateSecret(legacyKey, {
            projectId,
            environment,
            secretValue: activeSecret.secretValue
        });

        // 3) Set new active pepper
        await client.secrets().updateSecret(activeKey, {
            projectId,
            environment,
            secretValue: newPepper
        });

        const setEnvValue = <K extends keyof typeof env>(key: K, value: typeof env[K]) => {
            (env as typeof env)[key] = value;
        };

        setEnvValue(activeKey as keyof typeof env, newPepper);
        setEnvValue(legacyKey as keyof typeof env, activeSecret.secretValue);

    }

    private static signState(id: string, revoked: boolean, foreignKeyId: string, type: boolean = false, success: boolean = true) {
        const data = `${id}:${revoked}:${foreignKeyId}`;
        const pepperRefreshToken = success ? env.PEPPER_REFRESH_ACTIVE : env.PEPPER_REFRESH_LEGACY;
        const pepperSession = success ? env.PEPPER_SESSION_ACTIVE : env.PEPPER_SESSION_LEGACY;
        return type ? crypto.createHmac('sha256', pepperSession).update(data).digest('hex') : crypto.createHmac('sha256', pepperRefreshToken).update(data).digest('hex');
    }

    private static generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    private static generateHash = (plainToken: string, salt: string) => {
        return crypto.createHash('sha256').update(plainToken + salt).digest('hex');
    }
}
