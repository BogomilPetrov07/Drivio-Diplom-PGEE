import crypto from 'crypto';
import {and, desc, eq, gt, or} from "drizzle-orm";
import {v4 as uuid4} from "uuid";
import {instructorProfiles, refreshTokens, sessions, users} from "../../../drizzle/schemas/index.js"; // Modular schema exports
import {db} from "../../config/drizzle.js"; // Your Drizzle Proxy client
import {env} from "../../config/env.js";
import {client} from "../../config/infisical.js";
import {REDIS_KEYS} from "../../config/redis-keys.js";
import {redis} from "../../config/redis.js";
import {sendWelcomeEmailReact} from "../../utils/email.js";
import {compare, hash} from "../../utils/password.js";
import {RefreshTokenCollectionDTO, RefreshTokenDTO, Role, SessionDTO} from "./auth.types.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
    static async isSessionActive(sessionId: string, userId?: string) {
        const now = new Date();
        const activeSession = await db.query.sessions.findFirst({
            where: and(
                eq(sessions.id, sessionId),
                eq(sessions.revoked, false),
                gt(sessions.expiresAt, now),
                ...(userId ? [eq(sessions.userId, userId)] : []),
            ),
            columns: { id: true, userId: true },
        });

        if (activeSession) return true;

        // Cache revoke marker so access-token checks fail fast after first rejection.
        await redis.set(REDIS_KEYS.SESSION_REVOKE(sessionId), "true", "EX", 960);
        return false;
    }

    static async login(identifier: string, password: string, ip: string | undefined) {
        // Relational query to include sessions
        const user = await db.query.users.findFirst({
            where: or(eq(users.username, identifier), eq(users.email, identifier)),
            with: {sessions: true}
        });

        if (!user) return null;

        const {id, role, email, username} = user;
        const ok = await compare(password, user.password);
        if (!ok) return null;

        const roles = await this.getUserRoles(id, role as Role);
        const hasInstructorPrivileges = roles.includes("INSTRUCTOR");
        return {id, username, role: role as Role, roles, activeRole: role as Role, email, hasInstructorPrivileges};
    }

    static async revokeActiveSessionsForIp(userId: string, ip: string | undefined) {
        const activeSessions = await db.query.sessions.findMany({
            where: and(
                eq(sessions.userId, userId),
                eq(sessions.ip, ip || ""),
                eq(sessions.revoked, false)
            ),
            orderBy: [desc(sessions.createdAt)]
        });

        await Promise.all(activeSessions.map(async (session) => {
            const refreshTokenRecords = await db.query.refreshTokens.findMany({
                where: eq(refreshTokens.sessionId, session.id)
            });

            await Promise.all(refreshTokenRecords.map((record) =>
                db.update(refreshTokens)
                    .set({
                        revoked: true,
                        signature: this.signState(record.id, true, session.id, "refresh")
                    })
                    .where(eq(refreshTokens.id, record.id))
            ));

            await db.update(sessions)
                .set({
                    revoked: true,
                    signature: this.signState(session.id, true, userId, "session")
                })
                .where(eq(sessions.id, session.id));

            await redis.set(REDIS_KEYS.SESSION_REVOKE(session.id), "true", "EX", 960);
        }));
    }

    static async createRefreshToken(sessionId: string) {
        const tokenValue = this.generateRefreshToken();
        const tokenId = uuid4();
        const hashedValue = this.generateHash(tokenValue, tokenId);
        const signature = this.signState(tokenId, false, sessionId, "refresh");

        // Standard insert syntax
        await db.insert(refreshTokens).values({
            id: tokenId,
            tokenHash: hashedValue,
            sessionId: sessionId,
            signature: signature,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        });

        return {tokenId, tokenValue};
    }

    static async rotateRefreshToken(tokenId: string, tokenValue: string) {
        // Fetch token with its parent session
        const record = await db.query.refreshTokens.findFirst({
            where: eq(refreshTokens.id, tokenId),
            with: {
                session: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                role: true,
                                username: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });

        if (!record || !record.session || !record.session.user) return null;
        const { session, ...token } = record;
        const user = session.user;
        const now = new Date();

        if (token.expiresAt <= now || session.expiresAt <= now) {
            await db.update(refreshTokens)
                .set({
                    revoked: true,
                    signature: this.signState(token.id, true, session.id, "refresh")
                })
                .where(eq(refreshTokens.id, token.id));

            await db.update(sessions)
                .set({
                    revoked: true,
                    signature: this.signState(session.id, true, session.userId, "session")
                })
                .where(eq(sessions.id, session.id));

            await redis.set(REDIS_KEYS.SESSION_REVOKE(session.id), "true", "EX", 960);
            return null;
        }

        // Fetch sibling tokens
        const allSessionTokens = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.sessionId, session.id),
        });

        const isIntegrityValid = await this.verifyIntegrity(token as any, session as any, allSessionTokens as any);
        if (!isIntegrityValid) return null;

        if (token.revoked || session.revoked) {
            if (token.revoked) console.warn("Possible reuse attack! Token was already revoked.");
            return null;
        }

        if (this.generateHash(tokenValue, token.id) !== token.tokenHash) return null;

        // Drizzle transaction syntax
        return await db.transaction(async (tx) => {
            const newRefreshToken = await this.createRefreshToken(session.id);

            await tx.update(refreshTokens)
                .set({
                    revoked: true,
                    replaceTokenId: newRefreshToken.tokenId,
                    replacedAt: new Date(),
                    signature: this.signState(tokenId, true, session.id, "refresh")
                })
                .where(eq(refreshTokens.id, tokenId));

            return {
                refreshToken: newRefreshToken,
                user: user,
                sessionId: session.id
            };
        });
    }

    static async createSession(userId: string, userAgent: string, ip: string) {
        const sessionId = uuid4();
        const signature = this.signState(sessionId, false, userId, "session");

        await db.insert(sessions).values({
            id: sessionId,
            userId: userId,
            deviceName: userAgent,
            ip: ip,
            signature: signature,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        });

        return sessionId;
    }

    static async register(username: string, password: string, role: Role, email: string, secondaryRole?: Role) {
        const hashedPassword = await hash(password);
        return db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                username,
                email,
                password: hashedPassword,
                role: role as any
            }).returning();

            const wantsInstructor = secondaryRole === "INSTRUCTOR" || role === "INSTRUCTOR";
            if (wantsInstructor) {
                await tx.insert(instructorProfiles).values({
                    userId: newUser.id,
                }).onConflictDoNothing();
            }

            return newUser;
        });
    }

    static async logout(sessionId: string, userId: string) {
        const refreshTokenRecords = await db.query.refreshTokens.findMany({
            where: eq(refreshTokens.sessionId, sessionId)
        });

        // Update all related refresh tokens
        await Promise.all(refreshTokenRecords.map((record) =>
            db.update(refreshTokens)
                .set({
                    revoked: true,
                    signature: this.signState(record.id, true, sessionId, "refresh")
                })
                .where(eq(refreshTokens.id, record.id))
        ));

        const newSignature = this.signState(sessionId, true, userId, "session");
        await db.update(sessions)
            .set({revoked: true, signature: newSignature})
            .where(eq(sessions.id, sessionId));

        await redis.set(REDIS_KEYS.SESSION_REVOKE(sessionId), "true", "EX", 960);
    }

    static async logoutByRefreshToken(refreshTokenCookie: string) {
        const [tokenId, tokenValue] = refreshTokenCookie.split(":");
        if (!tokenId || !tokenValue) return;

        const record = await db.query.refreshTokens.findFirst({
            where: eq(refreshTokens.id, tokenId),
            with: {
                session: {
                    with: {
                        user: {
                            columns: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (!record || !record.session || !record.session.user) return;
        if (this.generateHash(tokenValue, tokenId) !== record.tokenHash) return;

        await this.logout(record.session.id, record.session.user.id);
    }


    static async getUserRoles(userId: string, primaryRole: Role): Promise<Role[]> {
        const roles = [primaryRole];

        const hasInstructorProfile = await db.query.instructorProfiles.findFirst({
            where: eq(instructorProfiles.userId, userId),
            columns: { id: true },
        });

        if (hasInstructorProfile && primaryRole !== "INSTRUCTOR") {
            roles.push("INSTRUCTOR");
        }

        return Array.from(new Set(roles)).slice(0, 2) as Role[];
    }
    static async sendEmail(email: string, username: string) {
        try {
            const { data, error } = await sendWelcomeEmailReact(email, username);

            if (error) {
                console.error("Resend Error Details:", error);
                return false;
            }

            console.log("Email sent successfully. ID:", data?.id);
            return true;
        } catch (err: any) {
            console.error("Critical Email Error:", err.message);
            return false;
        }
    }

    static async rotatePepper(type: 'refresh' | 'session') {
        const newPepper = crypto.randomBytes(32).toString("hex");
        const environment = process.env.NODE_ENV === "production" ? "prod" : "dev";
        const projectId = process.env.INFISICAL_PROJECT_ID!;
        const activeKey = type === 'refresh' ? "PEPPER_REFRESH_ACTIVE" : "PEPPER_SESSION_ACTIVE";
        const legacyKey = type === 'refresh' ? "PEPPER_REFRESH_LEGACY" : "PEPPER_SESSION_LEGACY";

        const activeSecret = await client.secrets().getSecret({
            projectId, environment, secretName: activeKey
        });

        if (!activeSecret?.secretValue) {
            throw new Error(`Missing current active pepper: ${activeKey}`);
        }

        await client.secrets().updateSecret(legacyKey, {
            projectId, environment, secretValue: activeSecret.secretValue
        });

        await client.secrets().updateSecret(activeKey, {
            projectId, environment, secretValue: newPepper
        });

        const setEnvValue = <K extends keyof typeof env>(key: K, value: typeof env[K]) => {
            (env as typeof env)[key] = value;
        };

        setEnvValue(activeKey as keyof typeof env, newPepper);
        setEnvValue(legacyKey as keyof typeof env, activeSecret.secretValue);
        return true;
    }

    private static async verifyIntegrity(refreshToken: RefreshTokenDTO, session: SessionDTO, allSessionTokens: RefreshTokenCollectionDTO) {
        const activeSignature = this.signState(refreshToken.id, refreshToken.revoked, session.id, "refresh");
        if (refreshToken.signature === activeSignature) return true;

        const legacySignature = this.signState(refreshToken.id, refreshToken.revoked, session.id, "refresh", false);
        if (refreshToken.signature === legacySignature) {
            await db.update(refreshTokens)
                .set({signature: activeSignature})
                .where(eq(refreshTokens.id, refreshToken.id));
            return true;
        }

        console.error("ALERT: Database tampering detected for token:", refreshToken.id);
        await this.handleSecurityBreach(session, allSessionTokens);
        return false;
    }

    private static async handleSecurityBreach(session: SessionDTO, allSessionTokens: RefreshTokenCollectionDTO) {
        const expectedSessionSig = this.signState(session.id, session.revoked, session.userId, "session");
        const isSessionTampered = session.signature !== expectedSessionSig && session.signature !== this.signState(session.id, session.revoked, session.userId, "session", false);

        if (isSessionTampered) {
            console.error("ALERT: Database tampering detected for session:", session.id);
        }

        await Promise.all([...allSessionTokens.map(record =>
            db.update(refreshTokens)
                .set({revoked: true, signature: this.signState(record.id, true, session.id, "refresh")})
                .where(eq(refreshTokens.id, record.id))
        ),
            db.update(sessions)
                .set({revoked: true, signature: this.signState(session.id, true, session.userId, "session")})
                .where(eq(sessions.id, session.id))
        ]);
    }

    private static signState(id: string, revoked: boolean, foreignKeyId: string, type: "refresh" | "session", success: boolean = true) {
        const data = `${id}:${revoked}:${foreignKeyId}`;
        const pepperRefreshToken = success ? env.PEPPER_REFRESH_ACTIVE : env.PEPPER_REFRESH_LEGACY;
        const pepperSession = success ? env.PEPPER_SESSION_ACTIVE : env.PEPPER_SESSION_LEGACY;
        return type === "session" ? crypto.createHmac('sha256', pepperSession).update(data).digest('hex') : type === "refresh" ? crypto.createHmac('sha256', pepperRefreshToken).update(data).digest('hex') : null;
    }

    private static generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    private static generateHash = (plainToken: string, salt: string) => {
        return crypto.createHash('sha256').update(plainToken + salt).digest('hex');
    }
}



