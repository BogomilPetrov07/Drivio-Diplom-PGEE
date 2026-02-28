import { initConfig, env } from "./config/env.js";
import {initCronJobs} from "./config/cron.js";

async function bootstrap() {
    try {
        // 1. Load all secrets from Infisical first
        await initConfig("/backend/app");

        //2. Initialize cron jobs
        await initCronJobs();

        // 3. Dynamically import the app AFTER config is ready
        // This ensures routes, controllers, and DB clients get the secrets
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