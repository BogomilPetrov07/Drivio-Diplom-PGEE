import { initConfig, env } from "../config/env.js";
import pg from "pg";
import { logDbConnectionString, resolveDbConnectionString } from "./db-connection-log.js";

async function runNuke() {
  try {
    await initConfig("/backend/app", true);

    const connectionString = resolveDbConnectionString();
    logDbConnectionString("db:nuke", connectionString);

    const client = new pg.Client({ connectionString });
    await client.connect();

    console.log(`🧨 Nuking database schema for [Env: ${env.NODE_ENV}]...`);

    await client.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await client.query(`CREATE SCHEMA public;`);

    await client.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    await client.query(`GRANT ALL ON SCHEMA public TO public;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await client.end();
    console.log("✅ Database schema and migration history removed.");
  } catch (error) {
    console.error("❌ Nuke failed:", error);
    process.exit(1);
  }
}

runNuke().then(() => {
  console.log("✅ Process executed!");
});
