import { initConfig, env } from "../config/env.js";
import pg from "pg";
import { logDbConnectionString, resolveDbConnectionString } from "./db-connection-log.js";

async function runRecreate() {
    try {
        // Initialize using the bound identity (e.g., client-dev)
        await initConfig("/backend/app", true);

        // Pick the authorized URL (prioritizing DIRECT_URL if available)
        const connectionString = resolveDbConnectionString();
        logDbConnectionString("db:recreate", connectionString);

        const client = new pg.Client({ connectionString });
        await client.connect();

        console.log(`🧨 RECREATING DATABASE: [Env: ${env.NODE_ENV}]`);

        // 1. Wipe application data
        await client.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
        await client.query(`CREATE SCHEMA public;`);

        // 2. Wipe Drizzle migration history
        await client.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

        await client.query(`GRANT ALL ON SCHEMA public TO public;`);

        console.log("✅ Database and migration history wiped.");
        await client.end();
    } catch (error) {
        console.error("❌ Recreate failed:", error);
        process.exit(1);
    }
}

runRecreate().then(() => {console.log("✅ Process executed!")});
