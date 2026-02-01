import "dotenv/config";
import {defineConfig} from "prisma/config";


const getUrl = () => {
    switch (process.env.NODE_ENV) {
        case "production":
            return process.env.DATABASE_URL; // Folder with production-only models
        case "test":
            return process.env.DIRECT_URL; // Folder with test/mock models
        case "development":
        default:
            return process.env.LOCAL_DB_URL;  // Standard dev folder
    }
};

export default defineConfig({
    schema: "./prisma/schemas",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // For faster tests and NOT consume Neon resources
        url: getUrl(),
    },
});
