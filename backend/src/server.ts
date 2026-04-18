import http from "node:http";
import { initConfig, env } from "./config/env.js";
import { initCronJobs } from "./config/cron.js";
import { initializeDb } from "./config/drizzle.js";
import { initializeRedis } from "./config/redis.js";
import { initSocket } from "./realtime/socket.js";

async function bootstrap() {
  try {
    await initConfig("/backend/app");
    await initializeDb();
    await initializeRedis();
    await initCronJobs();

    const { default: app } = await import("./app.js");
    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
