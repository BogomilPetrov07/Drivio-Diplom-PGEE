import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';
import * as schema from '../../drizzle/schemas/index.js';

type DrizzleClient = NodePgDatabase<typeof schema>;
let internalDb: DrizzleClient | null = null;

const initDb = (): DrizzleClient => {
    if (internalDb) return internalDb;

    const environment = env.NODE_ENV;
    let connectionString = environment === 'production' ? env.DATABASE_URL : environment === 'test' ? env.DIRECT_URL : env.LOCAL_DB_URL;

    if (!connectionString) {
        throw new Error("❌ Drizzle Proxy: No connection string found. Is Infisical initialized?");
    }

    const pool = new pg.Pool({ connectionString });

    // Pass the schema object to enable Relational Queries (db.query...)
    internalDb = drizzle(pool, { schema });
    return internalDb;
};

export const db = new Proxy({} as DrizzleClient, {
    get: (_target, prop) => {
        const client = initDb();
        return Reflect.get(client, prop);
    }
});