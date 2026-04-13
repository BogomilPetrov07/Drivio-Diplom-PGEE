import { initConfig, env } from "../config/env.js";
import pg from "pg";

async function runNuke() {
  try {
    await initConfig("/backend/app", true);

    const connectionString = env.DIRECT_URL || env.DATABASE_URL || env.LOCAL_DB_URL;
    if (!connectionString) {
      throw new Error("No database URL found in env (DIRECT_URL / DATABASE_URL / LOCAL_DB_URL).");
    }

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

