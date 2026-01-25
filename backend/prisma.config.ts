import "dotenv/config";
import {defineConfig} from "prisma/config";
import {env} from "./src/config/env";

export default defineConfig({
    schema: "prisma/schemas",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // For faster tests and NOT consume Neon resources
        url: env.LOCAL_DB_URL,
    },
});
