import {Request, Response} from "express";
import {AuthService} from "./auth.service.js";
import {AuthPayload, LoginDTO, RegisterDTO} from "./auth.types.js";
import {signAccessToken, verifyAccessToken} from "../../utils/jwt";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export class AuthController {
    static login = async (req: Request, res: Response) => {
        const data: LoginDTO = req.body;
        const user = await AuthService.login(data.username, data.password);
        if (!user) return res.sendStatus(404);

        const session = await AuthService.createSession(user.id, req.headers["user-agent"] as string, req.ip as string);
        const refreshToken = await AuthService.createRefreshToken(session.id);
        const accessToken = signAccessToken({userId: user.id, role: user.role, sessionId: session.id});

        res.cookie("accessToken", accessToken, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 15 * 60 * 1000
        })

        res.cookie("refreshToken", `${refreshToken.tokenId}:${refreshToken.tokenValue}`, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({username: user.username});
    };

    static logout = async (req: Request, res: Response) => {
        const accessToken = req.cookies["accessToken"];
        const decoded = verifyAccessToken(accessToken) as AuthPayload;

        if (!decoded) return res.sendStatus(401);
        await AuthService.logout(decoded.sessionId);

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.sendStatus(204);
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
        res.cookie("refreshToken", `${newRefreshToken?.token.id}:${newRefreshToken?.tokenValue}`, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000
        });


        const accessTokenCookie = req.cookies["accessToken"];
        const decoded = verifyAccessToken(accessTokenCookie) as AuthPayload;
        if (decoded.sessionId !== newRefreshToken?.token.sessionId) return res.sendStatus(401);

        // Generate a new access token based on the old one
        const newAccessToken = signAccessToken({userId: decoded.userId, role: decoded.role, sessionId: decoded.sessionId});
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true, secure: true, sameSite: "strict", maxAge: 15 * 60 * 1000
        })

        res.json({message: "Access token refreshed"});
    }

    static sendEmail = async (req: Request, res: Response) => {
        try {
            const {email, username} = req.body;
            const response: SMTPTransport.SentMessageInfo = await AuthService.sendEmail(email, username);
            res.status(200).json(response);
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    }

}