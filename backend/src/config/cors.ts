import { CorsOptions } from "cors";
import { env } from "./env.js";

// Load the string from the env object
const frontendUrlsRaw = env.FRONTEND_URL;

// Convert the string back into an array
const allowedOrigins = frontendUrlsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const localAllowedOrigins = new Set([
    "http://localhost",
    "http://app.localhost",
    "http://api.localhost",
    "https://localhost",
    "https://app.localhost",
    "https://api.localhost",
]);

const allowList = new Set([...allowedOrigins, ...localAllowedOrigins]);

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser or same-origin requests without Origin header
        if (!origin) return callback(null, true);

        if (allowList.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};
