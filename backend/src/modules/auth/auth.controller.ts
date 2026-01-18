import {Request, Response} from "express";
import {AuthService} from "./auth.service.js";
import {LoginDTO, RegisterDTO} from "./auth.types.js";
import {signAccessToken} from "../../utils/jwt";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export class AuthController {
    static login = async (req: Request, res: Response) => {
        const data: LoginDTO = req.body;
        const user = await AuthService.login(data.username, data.password);
        if (!user) return res.sendStatus(404);

        const session = await AuthService.createSession(user.id, req.headers["user-agent"] as string, req.ip as string);
        const refreshTokenValue = AuthService.createRefreshToken(session.id);
        const accessToken = signAccessToken({userId: user.id, role: user.role, sessionId: session.id});

        res.cookie("refreshToken", refreshTokenValue, {
            httpOnly: true, secure: true, sameSite: "strict",
        });

        res.json({accessToken, username: user.username});
    };

    static logout = async (_req: Request, res: Response) => {
        //const refreshToken = req.cookies.refreshToken;

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

    // static refreshToken = async (_req: Request, res: Response) => {
    //     res.sendStatus(200);
    // }

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