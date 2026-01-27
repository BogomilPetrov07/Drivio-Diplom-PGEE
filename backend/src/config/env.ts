import "dotenv/config";
import { client, initInfisical } from "./infisical.js";

/**
 * 1. Define a strict type for your environment.
 * This provides autocomplete and prevents typos throughout your project.
 */
export type EnvConfig = {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    DIRECT_URL: string;
    LOCAL_DB_URL: string;
    UPSTASH_REDIS_URL: string;
    DOCKER_REDIS_URL: string;
    JWT_PRIVATE_KEY: string;
    JWT_PUBLIC_KEY: string;
    PEPPER_REFRESH_ACTIVE: string;
    PEPPER_REFRESH_LEGACY: string;
    PEPPER_SESSION_ACTIVE: string;
    PEPPER_SESSION_LEGACY: string;
    FRONTEND_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
};

// Internal variable held in memory after initialization
let internalEnv: EnvConfig;

/**
 * 2. Key Cleaning Utility
 * Fixes formatting for RSA/EC Private keys that might be flattened into single lines.
 */
const cleanKey = (key: string): string => {
    return key
        .replace(/\\n/g, '\n')      // Convert literal '\n' strings to real newlines
        .split('\n')               // Split into array
        .map(line => line.trim())  // Remove stray spaces from each line
        .filter(line => line)      // Remove empty lines
        .join('\n');               // Reassemble
};

/**
 * 3. The Getter
 * Use this in your code to use the env
 */
export const getEnv = (): EnvConfig => {
    if (!internalEnv) {
        throw new Error("❌ Env has not been initialized. Call initConfig() at app startup.");
    }
    return internalEnv;
};

/**
 * 4. Configuration Bootstrapper
 * Called once in your index.ts/server.ts before the app starts.
 */
export async function initConfig() {
    try {
        // Authenticate with Infisical Machine Identity
        await initInfisical();

        const environment = process.env.NODE_ENV === "production" ? "prod" : "dev";

        // Fetch all secrets for the project
        const { secrets } = await client.secrets().listSecrets({
            environment: environment,
            projectId: process.env.INFISICAL_PROJECT_ID!,
            attachToProcessEnv: true, // Populates process.env for third-party libs
        });

        // Helper to extract and validate existence
        const getVal = (key: string): string => {
            const secret = secrets.find((s) => s.secretKey === key);
            if (!secret || !secret.secretValue) {
                throw new Error(`Missing required secret: ${key} in ${environment} environment.`);
            }
            return secret.secretValue;
        };

        // Map and Transform
        internalEnv = {
            NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) ?? "development",
            PORT: Number(getVal("PORT") || 3000),
            DATABASE_URL: getVal("DATABASE_URL"),
            DIRECT_URL: getVal("DIRECT_URL"),
            LOCAL_DB_URL: getVal("LOCAL_DB_URL"),
            UPSTASH_REDIS_URL: getVal("UPSTASH_REDIS_URL"),
            DOCKER_REDIS_URL: getVal("DOCKER_REDIS_URL"),
            JWT_PRIVATE_KEY: cleanKey(getVal("JWT_PRIVATE_KEY")),
            JWT_PUBLIC_KEY: cleanKey(getVal("JWT_PUBLIC_KEY")),
            PEPPER_REFRESH_ACTIVE: getVal("PEPPER_REFRESH_ACTIVE"),
            PEPPER_REFRESH_LEGACY: getVal("PEPPER_REFRESH_LEGACY"),
            PEPPER_SESSION_ACTIVE: getVal("PEPPER_SESSION_ACTIVE"),
            PEPPER_SESSION_LEGACY: getVal("PEPPER_SESSION_LEGACY"),
            FRONTEND_URL: getVal("FRONTEND_URL"),
            SMTP_HOST: getVal("SMTP_HOST"),
            SMTP_PORT: Number(getVal("SMTP_PORT")),
            SMTP_USER: getVal("SMTP_USER"),
            SMTP_PASS: getVal("SMTP_PASS"),
            EMAIL_FROM: getVal("EMAIL_FROM"),
        };

        console.log(`✅ Secrets loaded successfully from Infisical [Env: ${environment}]`);
    } catch (error) {
        console.error("❌ Failed to initialize configuration:", error);
        process.exit(1); // Kill the process if secrets are missing
    }
}

export const env = new Proxy({} as EnvConfig, {
    get: (_, prop: keyof EnvConfig) => {
        return getEnv()[prop];
    }
});