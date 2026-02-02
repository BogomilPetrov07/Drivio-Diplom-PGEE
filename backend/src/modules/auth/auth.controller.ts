import {Request, Response} from "express";
import {AuthService} from "./auth.service.js";
import {LoginDTO, RegisterDTO, RotateDTO} from "./auth.types.js";
import {signAccessToken} from "../../utils/jwt.js";
import {env} from "../../config/env.js";

export class AuthController {
    static login = async (req: Request, res: Response) => {
        const data: LoginDTO = req.body;
        const user = await AuthService.login(data.username, data.password, req.ip);
        if (user === undefined) return res.status(409).json("User already logged in");
        if (user === null) return res.sendStatus(404);

        const sessionId = await AuthService.createSession(user.id, req.headers["user-agent"] as string, req.ip as string);
        const refreshToken = await AuthService.createRefreshToken(sessionId);
        const accessToken = signAccessToken({userId: user.id, role: user.role, sessionId: sessionId});

        const cookieOptions = {
            httpOnly: true,
            secure: env.NODE_ENV === "production" || env.NODE_ENV === "test",
            sameSite: "lax" as const,
            domain: env.COOKIE_DOMAIN, // .localhost in dev, .drivio-bg.com in prod
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        })

        res.cookie("refreshToken", `${refreshToken.tokenId}:${refreshToken.tokenValue}`, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({username: user.username});
    };

    static logout = async (req: Request, res: Response) => {
        await AuthService.logout(req.user!.sessionId, req.user!.id);

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(204).json({message: "User logged out"});
    };

    static register = async (req: Request, res: Response) => {
        try {
            const data: RegisterDTO = req.body;
            const user = await AuthService.register(data.username, data.password, data.role, data.email);
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
        const newRefreshToken = await AuthService.rotateRefreshToken(tokenId, refreshTokenValue);

        if (!newRefreshToken) return res.sendStatus(401);

        res.cookie("refreshToken", `${newRefreshToken.tokenId}:${newRefreshToken.tokenValue}`, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Generate a new access token based on the old one
        const newAccessToken = signAccessToken({userId: req.user!.id, role: req.user!.role, sessionId: req.user!.sessionId});
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 5 * 60 * 1000
        })

        res.json({message: "Access token refreshed"});
    }

    static rotatePepper = async (req: Request, res: Response) => {
        const variant: RotateDTO = req.body;

        if (!variant) return res.sendStatus(500);

        await AuthService.rotatePepper(variant.type)

        res.status(200).json({message: "Rotation Successfully Done"});
    }

    static sendEmail = async (req: Request, res: Response) => {
        try {
            const {email, username} = req.body;
            const response = await AuthService.sendEmail(email, username);
            if (!response) return res.sendStatus(500);
            res.sendStatus(200);
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    }
}