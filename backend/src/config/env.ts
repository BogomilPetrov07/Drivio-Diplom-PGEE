import "dotenv/config";
import {client, initInfisical} from "./infisical.js";

/**
 * 1. Define a strict type for your environment.
 * This provides autocomplete and prevents typos throughout your project.
 */
export type EnvConfig = {
    // CORS config secrets
    NODE_ENV: "dev" | "staging" | "prod" | "test";
    PORT: number;
    COOKIE_DOMAIN: string;
    FRONTEND_URL: string;

    // PrismaORM and DB config secrets
    DATABASE_URL?: string;
    DIRECT_URL?: string;
    LOCAL_DB_URL?: string;

    // Auth config secrets
    UPSTASH_REDIS_URL?: string;
    DOCKER_REDIS_URL?: string;
    JWT_PUBLIC_KEY: string;
    JWT_PRIVATE_KEY: string;
    PEPPER_REFRESH_ACTIVE: string;
    PEPPER_REFRESH_LEGACY: string;
    PEPPER_SESSION_ACTIVE: string;
    PEPPER_SESSION_LEGACY: string;

    // Email config secrets
    MJ_APIKEY_PUBLIC: string;
    MJ_APIKEY_PRIVATE: string;
    EMAIL_FROM: string;
};

// Internal variable held in memory after initialization
let internalEnv: Partial<EnvConfig> | null = null;

/**
 * 2. The Getter
 * Use this in your code to use the env
 */
export const getEnv = (): EnvConfig => {
    if (!internalEnv) {
        throw new Error("❌ Env has not been initialized. Call initConfig() at app startup.");
    }
    return internalEnv as EnvConfig;
};

/**
 * 3. Configuration Bootstrapper
 * Called once in your index.ts/server.ts before the app starts.
 */
export async function initConfig(path: string, isBuild = false) {
    try {
        // Authenticate with Infisical Machine Identity
        await initInfisical();

        const environment = process.env.INFISICAL_ENV!;

        // Fetch all secrets for the project
        const rootResponse = await client.secrets().listSecrets({
            environment: environment,
            projectId: process.env.INFISICAL_PROJECT_ID!,
            secretPath: path,
            recursive: !isBuild,
            attachToProcessEnv: false
        });

        let secrets = [...rootResponse.secrets];

        if (isBuild) {
            const dbResponse = await client.secrets().listSecrets({
                environment,
                projectId: process.env.INFISICAL_PROJECT_ID!,
                secretPath: `${path}/db`,
                recursive: false,
            });
            secrets = [...secrets, ...dbResponse.secrets];
        }

        // Helper to extract and validate existence
        const getVal = (key: string): string => {
            const secret = secrets.find((s) => s.secretKey === key);
            if (!secret || !secret.secretValue) {
                throw new Error(`Missing required secret: ${key} in ${environment} environment.`);
            }
            return secret.secretValue;
        };

        const getEnv = (): "dev" | "staging" | "prod" | "test" => {
            const secret = secrets.find((s) => s.secretKey === "NODE_ENV");
            if (!secret || !secret.secretValue) {
                throw new Error(`Missing required secret: NODE_ENV in ${environment} environment.`);
            }
            return secret.secretValue as "dev" | "staging" | "prod" | "test";
        }

        const getValOptional = (key: string): string | undefined => {
            const secret = secrets.find((s) => s.secretKey === key);
            return secret?.secretValue; // Don't throw if missing
        };

        if (isBuild) {
            // Load only PrismaORM needed secrets to can execute npx prisma generate
            internalEnv = {
                NODE_ENV: getEnv(),
                DATABASE_URL: getValOptional("DATABASE_URL"),
                DIRECT_URL: getValOptional("DIRECT_URL"),
                LOCAL_DB_URL: getValOptional("LOCAL_DB_URL")
            };
            console.log(`🛠️  Build env initialized from ${path}`);
            return;
        }

        // Map and Transform
        internalEnv = {
            // CORS config secrets
            NODE_ENV: getEnv(),
            PORT: Number(getVal("PORT")),
            COOKIE_DOMAIN: getVal("COOKIE_DOMAIN"),
            FRONTEND_URL: getVal("FRONTEND_URL"),

            // PrismaORM and DB config secrets
            DATABASE_URL: getValOptional("DATABASE_URL"),
            DIRECT_URL: getValOptional("DIRECT_URL"),
            LOCAL_DB_URL: getValOptional("LOCAL_DB_URL"),

            // Auth config secrets
            UPSTASH_REDIS_URL: getValOptional("UPSTASH_REDIS_URL"),
            DOCKER_REDIS_URL: getValOptional("DOCKER_REDIS_URL"),
            JWT_PUBLIC_KEY: getVal("JWT_PUBLIC_KEY"),
            JWT_PRIVATE_KEY: getVal("JWT_PRIVATE_KEY"),
            PEPPER_REFRESH_ACTIVE: getVal("PEPPER_REFRESH_ACTIVE"),
            PEPPER_REFRESH_LEGACY: getVal("PEPPER_REFRESH_LEGACY"),
            PEPPER_SESSION_ACTIVE: getVal("PEPPER_SESSION_ACTIVE"),
            PEPPER_SESSION_LEGACY: getVal("PEPPER_SESSION_LEGACY"),

            // Email config secrets
            MJ_APIKEY_PUBLIC: getVal("MJ_APIKEY_PUBLIC"),
            MJ_APIKEY_PRIVATE: getVal("MJ_APIKEY_PRIVATE"),
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