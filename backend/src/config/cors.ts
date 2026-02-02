import { CorsOptions } from "cors";
import { env } from "./env.js";

// Load the string from the env object
const frontendUrlsRaw = env.FRONTEND_URL;

// Convert the string back into an array
const allowedOrigins = frontendUrlsRaw.split(',');

export const corsOptions: CorsOptions = {
    origin: allowedOrigins,
    credentials: true,
};
