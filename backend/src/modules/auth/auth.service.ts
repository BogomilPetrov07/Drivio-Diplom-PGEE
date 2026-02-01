import crypto from 'crypto';
import {prisma} from "../../config/prisma.js";
import {Role} from "@prisma/client";
import {env} from "../../config/env.js";
import {compare, hash} from "../../utils/password.js";
import {v4 as uuid4} from "uuid";
import {sendWelcomeEmailReact} from "../../utils/email.js";
import {redis} from "../../config/redis.js";
import {client} from "../../config/infisical.js";
import {RefreshTokenCollectionDTO, RefreshTokenDTO, SessionDTO} from "./auth.types";

export class AuthService {
    static async login(username: string, password: string, ip: string | undefined) {
        const user = await prisma.user.findUnique({where: {username}, include: {sessions: true}});

        if (!user) return null;

        const {id, role, email, sessions} = user;
        const isLoggedIn = sessions.reverse().find(session => session.ip === ip);
        if (isLoggedIn !== undefined) {
            if (!isLoggedIn.revoked) {
                return undefined;
            }
        }
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
        const record = await prisma.refreshToken.findUnique({
            where: { id: tokenId },
            select: {
                id: true, signature: true, revoked: true, tokenHash: true,
                session: { select: { id: true, revoked: true, userId: true, signature: true } }
            }
        });

        if (!record) return null;
        const { session, ...token } = record;

        // Get sibling tokens for potential mass-revocation
        const allSessionTokens = await prisma.refreshToken.findMany({
            where: { sessionId: session.id }, select: { id: true }
        });

        // Step 1: Integrity Check
        const isIntegrityValid = await this.verifyIntegrity(token, session, allSessionTokens);
        if (!isIntegrityValid) return null;

        // Step 2: Logic Check (Reuse Detection)
        if (token.revoked || session.revoked) {
            if (token.revoked) console.warn("Possible reuse attack! Token was already revoked.");
            return null;
        }

        // Step 3: Secret Hash Check
        if (this.generateHash(tokenValue, token.id) !== token.tokenHash) return null;

        // Step 4: Atomic Rotation
        return await prisma.$transaction(async (tx) => {
            const newRefreshToken = await this.createRefreshToken(session.id);

            await tx.refreshToken.update({
                where: { id: tokenId },
                data: {
                    revoked: true,
                    replaceTokenId: newRefreshToken.tokenId,
                    replacedAt: new Date(),
                    signature: this.signState(tokenId, true, session.id)
                }
            });

            return newRefreshToken;
        });
    }

    private static async verifyIntegrity(refreshToken: RefreshTokenDTO, session: SessionDTO, allSessionTokens: { id: string }[] ) {
        const expectedSignature = this.signState(refreshToken.id, refreshToken.revoked, session.id);

        if (refreshToken.signature === expectedSignature) return true;

        // Check Legacy
        const isLegacy = refreshToken.signature === this.signState(refreshToken.id, refreshToken.revoked, session.id, false, false);
        if (isLegacy) {
            await prisma.refreshToken.update({
                where: { id: refreshToken.id },
                data: { signature: expectedSignature }
            });
            return true;
        }

        // If we reach here, tampering is suspected
        console.error("ALERT: Database tampering detected for token:", refreshToken.id);
        await this.handleSecurityBreach(session, allSessionTokens);
        return false;
    }

    private static async handleSecurityBreach(session: SessionDTO, allSessionTokens: RefreshTokenCollectionDTO) {
        // 1. Verify Session Integrity specifically
        const expectedSessionSig = this.signState(session.id, session.revoked, session.userId, true);
        const isSessionTampered = session.signature !== expectedSessionSig &&
            session.signature !== this.signState(session.id, session.revoked, session.userId, true, false);

        if (isSessionTampered) {
            console.error("ALERT: Database tampering detected for session:", session.id);
        }

        // 2. Revoke everything linked to this session
        await Promise.all([
            ...allSessionTokens.map(record => prisma.refreshToken.update({
                where: { id: record.id },
                data: { revoked: true, signature: this.signState(record.id, true, session.id) }
            })),
            prisma.session.update({
                where: { id: session.id },
                data: { revoked: true, signature: this.signState(session.id, true, session.userId) }
            })
        ]);
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
        // 1. Revoke all refresh tokens linked to the session
        const refreshTokenRecords = await prisma.refreshToken.findMany({
            where: {sessionId: sessionId}, select: {id: true}
        });

        await Promise.all(refreshTokenRecords.map((record) => prisma.refreshToken.update({
            where: {id: record.id}, // Use the specific ID here!
            data: {
                revoked: true, signature: this.signState(record.id, true, sessionId)
            }
        })));

        // 2. Permanent change in DB for log outed session
        const newSignature = this.signState(sessionId, true, userId, true);
        await prisma.session.update({where: {id: sessionId}, data: {revoked: true, signature: newSignature}});

        // 3. Immediate Blacklist in Upstash (Expires in 15 mins / 900 seconds)
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
            projectId, environment, secretName: activeKey
        });

        if (!activeSecret?.secretValue) {
            throw new Error(`Missing current active pepper: ${activeKey}`);
        }

        // 2) Move current active -> legacy
        await client.secrets().updateSecret(legacyKey, {
            projectId, environment, secretValue: activeSecret.secretValue
        });

        // 3) Set new active pepper
        await client.secrets().updateSecret(activeKey, {
            projectId, environment, secretValue: newPepper
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
