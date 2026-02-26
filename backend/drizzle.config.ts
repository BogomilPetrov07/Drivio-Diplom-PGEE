import {defineConfig} from "drizzle-kit";

const getUrl = () => {
    // Fallback to 'development' if NODE_ENV is not set
    const nodeEnv = process.env.NODE_ENV || "development";

    switch (nodeEnv) {
        case "production":
            return process.env.DATABASE_URL;
        case "test":
        case "staging":
            // Drizzle uses the same URL logic as your prisma.config.ts
            return process.env.DIRECT_URL;
        case "development":
        default:
            return process.env.LOCAL_DB_URL;
    }
};

export default defineConfig({
    dialect: "postgresql",
    // POINT TO YOUR NEW FOLDER
    schema: "./drizzle/schemas/*.ts",
    // SPECIFY THE MIGRATIONS FOLDER
    out: "./drizzle/migrations",
    dbCredentials: {
        url: getUrl()!,
    },
    strict: true,
    verbose: true,
});