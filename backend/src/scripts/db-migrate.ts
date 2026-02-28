import { initConfig, env } from "../config/env.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

async function runMigration() {
    try {
        await initConfig("/backend/app", true);

        const connectionString = env.DIRECT_URL || env.DATABASE_URL || env.LOCAL_DB_URL;

        const sql = new pg.Pool({ connectionString, max: 1 });
        const db = drizzle(sql);

        console.log(`🚀 Applying migrations to [Env: ${env.NODE_ENV}]...`);

        // This applies the SQL files found in your 'drizzle' folder
        await migrate(db, { migrationsFolder: "drizzle/migrations" });

        console.log("✅ Migrations complete. Database is in sync with .ts schemas.");
        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration().then(() => {console.log("✅ Process executed!")});