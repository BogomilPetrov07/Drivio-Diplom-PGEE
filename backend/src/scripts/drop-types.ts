import pg from 'pg';
import { env, initConfig } from '../config/env.js';

async function setup() {
    await initConfig(undefined, true);

    const connectionString = env.DIRECT_URL ?? env.LOCAL_DB_URL;
    const client = new pg.Client({ connectionString });
    await client.connect();

    try {
        console.log("🚀 Starting Full Database Reset...");

        // 1. Drop all custom Enums (the "week_days" fix)
        await client.query(`
            DO $$ 
            DECLARE r RECORD;
            BEGIN
                FOR r IN (SELECT n.nspname, t.typname FROM pg_type t 
                          JOIN pg_namespace n ON n.oid = t.typnamespace 
                          WHERE n.nspname = 'public' AND t.typtype = 'e') 
                LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        `);

        // 2. Drop the schemas entirely to wipe tables AND Drizzle history
        // This is more reliable than 'drizzle-kit drop'
        await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
        await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');

        // 3. Recreate the public schema so Postgres is functional
        await client.query('CREATE SCHEMA public;');

        console.log("✅ Database is now EMPTY (No tables, no types, no history).");
    } catch (err) {
        console.error("❌ Reset failed:", err);
    } finally {
        await client.end();
    }
}

setup();