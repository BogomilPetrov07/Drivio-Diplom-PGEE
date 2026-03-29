import { initConfig, env } from "./config/env.js";
import {initCronJobs} from "./config/cron.js";
import { initializeDb } from "./config/drizzle.js";
import { initializeRedis } from "./config/redis.js";

async function bootstrap() {
    try {
        // 1. Load all secrets from Infisical first
        await initConfig("/backend/app");

        // 2. Initialize critical infrastructure before loading app module
        await initializeDb();
        await initializeRedis();

        // 3. Initialize cron jobs
        await initCronJobs();

        // 4. Dynamically import the app AFTER all services are ready
        const { default: app } = await import("./app.js");

        app.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

bootstrap().catch((err) => {
    console.error("💀 Fatal error during bootstrap:", err);
    process.exit(1);
});
