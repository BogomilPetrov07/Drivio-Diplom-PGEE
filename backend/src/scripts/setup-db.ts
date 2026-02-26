import pg from 'pg';
import {env, initConfig} from '../config/env.js'


async function setup() {

    await initConfig(undefined,true);

    const connectionString = env.DIRECT_URL ?? env.LOCAL_DB_URL; // Or whichever variable you use
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        await client.query('CREATE SCHEMA IF NOT EXISTS public;');
        await client.query('CREATE SCHEMA IF NOT EXISTS drizzle;');
        console.log("✅ Schemas 'public' and 'drizzle' are ready.");
    } finally {
        await client.end();
    }
}
setup();