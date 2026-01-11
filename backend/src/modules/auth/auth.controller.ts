import {Request, Response} from "express";
import {AuthService} from "./auth.service.js";
import {LoginDTO, RegisterDTO} from "./auth.types.js";
import {signAccessToken, signRefreshToken} from "../../utils/jwt";
import {prisma} from "../../config/prisma";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export class AuthController {
    static login = async (req: Request, res: Response) => {
        const data: LoginDTO = req.body;
        const user = await AuthService.login(data.username, data.password);
        if (!user) return res.sendStatus(401);

        const accessToken = signAccessToken({userId: user.id, role: user.role});
        const refreshTokenValue = signRefreshToken({userId: user.id});

        // Save token to DB with device info
        await prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                device: req.headers["user-agent"], // Capture device info
                ip: req.ip
            }
        });

        res.cookie("refreshToken", refreshTokenValue, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        res.json({accessToken, username: user.username});
    };

    static logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        // Remove the specific session from DB
        await prisma.refreshToken.deleteMany({
            where: {token: refreshToken}
        });

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

    static refreshToken = async (_req: Request, res: Response) => {
        res.sendStatus(200);
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