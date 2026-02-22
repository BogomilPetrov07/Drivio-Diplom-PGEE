import "dotenv/config";
import { defineConfig } from "prisma/config";


const getUrl = () => {
    // Fallback to 'development' if NODE_ENV is not set
    const nodeEnv = process.env.NODE_ENV || "development";

    switch (nodeEnv) {
        case "production":
            return process.env.DATABASE_URL;
        case "test":
            return process.env.DIRECT_URL;
        case "development":
        default:
            return process.env.LOCAL_DB_URL;
    }
};

export default defineConfig({
    schema: "./prisma/schemas",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: getUrl(),
    },
});