import {prisma} from "../../config/prisma.js";
import {compare, hash} from "../../utils/password.js";
import {Role} from "@genprisma/client";
import {sendWelcomeEmailReact} from "../../utils/email";

export class AuthService {
    static async login(username: string, password: string) {
        const user = await prisma.users.findUnique({ where: { username } });
        if (!user) return null;
        const ok = await compare(password, user.password);
        return ok ? user : null;
    }

    static async register(username: string, password: string, role: string, email: string) {
        const hashedPassword = await hash(password);
        return prisma.users.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role as Role
            }
        });
    }

    static async sendEmail(email: string, username: string) {
        return sendWelcomeEmailReact(email, username);
    }
}
