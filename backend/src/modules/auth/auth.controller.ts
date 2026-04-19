import {Request, Response} from "express";
import {env} from "../../config/env.js";
import {signAccessToken} from "../../utils/jwt.js";
import {AuthService} from "./auth.service.js";
import {AuthPayload, AuthUserDTO, LoginDTO, RegisterDTO, RotateDTO} from "./auth.types.js";

const ACCESS_COOKIE_TTL_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthController {
    static hasSessionCookie = async (req: Request, res: Response) => {
        const hasAccessToken = Boolean(req.cookies["accessToken"]);
        const hasRefreshToken = Boolean(req.cookies["refreshToken"]);
        return res.status(200).json({ hasSessionCookie: hasAccessToken || hasRefreshToken });
    }

    static login = async (req: Request, res: Response) => {
        try {
            const data: LoginDTO = req.body;
            const user = await AuthService.login(data.username, data.password, req.ip);
            if (user === null) return res.sendStatus(404);

            await AuthService.revokeActiveSessionsForIp(user.id, req.ip);

            const sessionId = await AuthService.createSession(user.id, req.headers["user-agent"] as string, req.ip as string);
            const refreshToken = await AuthService.createRefreshToken(sessionId);
            this.setAuthCookies(res, {
                userId: user.id,
                roles: user.roles,
                activeRole: user.activeRole,
                role: user.role,
                sessionId: sessionId
            }, {
                tokenId: refreshToken.tokenId,
                tokenValue: refreshToken.tokenValue
            });

            const authUser: AuthUserDTO = {
                id: user.id,
                username: user.username,
                email: user.email ?? null,
                role: user.role,
                roles: user.roles,
                activeRole: user.activeRole,
                hasInstructorPrivileges: user.hasInstructorPrivileges
            };

            res.json({user: authUser});
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    };

    static logout = async (req: Request, res: Response) => {
        if (req.user) {
            await AuthService.logout(req.user.sessionId, req.user.id);
        } else {
            const refreshTokenCookie = req.cookies["refreshToken"];
            if (refreshTokenCookie) {
                await AuthService.logoutByRefreshToken(refreshTokenCookie);
            }
        }

        this.clearAuthCookies(res);
        res.status(204).json({message: "User logged out"});
    };

    static register = async (req: Request, res: Response) => {
        try {
            const data: RegisterDTO = req.body;
            const user = await AuthService.register(data.username, data.password, data.role, data.email, data.secondaryRole);
            if (user) {
                res.status(201).json({message: "User created"});
            } else {
                res.sendStatus(409);
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    }

    static refreshAccessToken = async (req: Request, res: Response) => {
        const refreshTokenCookie = req.cookies["refreshToken"];
        if (!refreshTokenCookie) return res.sendStatus(401);

        // Construct new refresh token from old one
        const [tokenId, refreshTokenValue] = refreshTokenCookie.split(":");
        if (!tokenId || !refreshTokenValue) return res.sendStatus(401);
        const result = await AuthService.rotateRefreshToken(tokenId, refreshTokenValue);

        if (!result) return res.sendStatus(401);

        const roles = await AuthService.getUserRoles(result.user.id, result.user.role);
        const activeRole = result.user.role;

        this.setAuthCookies(res, {
            userId: result.user.id,
            roles,
            activeRole,
            role: result.user.role,
            sessionId: result.sessionId
        }, {
            tokenId: result.refreshToken.tokenId,
            tokenValue: result.refreshToken.tokenValue
        });

        const authUser: AuthUserDTO = {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email ?? null,
            role: result.user.role,
            roles,
            activeRole,
            hasInstructorPrivileges: roles.includes("INSTRUCTOR")
        };

        res.json({ message: "Access token refreshed", user: authUser });
    }

    static rotatePepper = async (req: Request, res: Response) => {
        const variant: RotateDTO = req.body;

        if (!variant) return res.sendStatus(500);

        await AuthService.rotatePepper(variant.type)

        res.status(200).json({message: "Rotation Successfully Done"});
    }

    // TODO: To make an Super Admin audit history log
    static auditLog = async (_req: Request, _res: Response) => {

    }

    static sendEmail = async (req: Request, res: Response) => {
        try {
            const { email, username } = req.body;

            const success = await AuthService.sendEmail(email, username);

            if (success) {
                return res.status(200).json({ message: "Email sent successfully" });
            } else {
                return res.status(500).json({ error: "Failed to send email" });
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    }

    static hello = async (req: Request, res: Response) => {
        if (!req.user) return res.sendStatus(401);

        return res.status(200).json({
            message: `Hello, ${req.user.role}! Your protected request succeeded.`
        });
    }

    private static getCookieOptions(maxAge: number, path = "/") {
        const baseOptions = {
            httpOnly: true,
            secure: this.shouldUseSecureCookies(),
            sameSite: "strict" as const,
            path,
            maxAge
        };

        // Avoid forcing cookie domain in localhost/dev because browsers may reject it.
        if (this.shouldAttachCookieDomain()) {
            return {
                ...baseOptions,
                domain: env.COOKIE_DOMAIN
            };
        }

        return baseOptions;
    }

    private static setAuthCookies(
        res: Response,
        payload: AuthPayload,
        refreshToken: { tokenId: string; tokenValue: string }
    ) {
        const accessToken = signAccessToken(payload);
        res.cookie("accessToken", accessToken, this.getCookieOptions(ACCESS_COOKIE_TTL_MS, "/"));

        // In local/dev flows we need refresh availability across app routes and probes.
        // Keep HttpOnly, but broaden path scope so refresh cookie is consistently present.
        const refreshCookieOptions = {
            ...this.getCookieOptions(REFRESH_COOKIE_TTL_MS, "/"),
            sameSite: "strict" as const,
        };

        res.cookie(
            "refreshToken",
            `${refreshToken.tokenId}:${refreshToken.tokenValue}`,
            refreshCookieOptions
        );
    }

    private static getClearCookieOptions(path = "/") {
        const baseOptions = {
            path,
            sameSite: "strict" as const,
            secure: this.shouldUseSecureCookies()
        };

        if (this.shouldAttachCookieDomain()) {
            return {
                ...baseOptions,
                domain: env.COOKIE_DOMAIN
            };
        }

        return baseOptions;
    }

    private static clearAuthCookies(res: Response) {
        res.clearCookie("accessToken", this.getClearCookieOptions("/"));
        res.clearCookie("refreshToken", {
            ...this.getClearCookieOptions("/"),
            sameSite: "strict" as const,
        });
    }

    private static shouldAttachCookieDomain() {
        if (env.COOKIE_DOMAIN === "empty") return false;
        const normalized = env.COOKIE_DOMAIN.toLowerCase();
        if (normalized.includes("localhost")) return false;
        return true;
    }

    private static shouldUseSecureCookies() {
        if (env.NODE_ENV !== "prod" && env.NODE_ENV !== "staging") return false;

        const cookieDomain = env.COOKIE_DOMAIN.toLowerCase();
        const frontendUrls = env.FRONTEND_URL.toLowerCase();

        const hasLocalhostTarget =
            cookieDomain.includes("localhost") ||
            frontendUrls.includes("localhost");

        return !hasLocalhostTarget;
    }
}
