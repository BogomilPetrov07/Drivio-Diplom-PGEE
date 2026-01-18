import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Access Token: Signed with Private Key
export const signAccessToken = (payload: { userId: string; role: string; sessionId: string }) => {
    return jwt.sign(payload, env.JWT_PRIVATE_KEY, {
        algorithm: "ES256",
        expiresIn: "15m"
    });
};

// // Refresh Token: Usually also signed with ES256 if following the same standard
// export const signRefreshToken = (payload: { userId: string }) => {
//     return jwt.sign(payload, env.JWT_PRIVATE_KEY, {
//         algorithm: "ES256",
//         expiresIn: "7d"
//     });
// };

// Verification: Always uses the Public Key
export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ["ES256"] });
};

// export const verifyRefreshToken = (token: string) => {
//     return jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ["ES256"] });
// };