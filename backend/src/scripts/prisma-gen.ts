import { initConfig, env } from "../config/env.js";
import { execSync } from "child_process";

async function run() {
    // 1. Specifically fetch from the DB folder
    await initConfig(undefined,true);

    console.log("⚙️  Generating Prisma Client...");

    // 2. Prisma CLI MUST have DATABASE_URL in the environment to run.
    // We pass it explicitly from our env object into the child process.
    execSync("npx prisma generate", {
        stdio: "inherit",
        env: {
            ...process.env,
            NODE_ENV: env.NODE_ENV,
            DIRECT_URL: env.DIRECT_URL,
            LOCAL_DB_URL: env.LOCAL_DB_URL,
            DATABASE_URL: env.DATABASE_URL
        }
    });
}

run();