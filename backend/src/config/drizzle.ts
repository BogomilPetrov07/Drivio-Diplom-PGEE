import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';
import * as schema from '../../drizzle/schemas/index.js';

type DrizzleClient = NodePgDatabase<typeof schema>;
let internalDb: DrizzleClient | null = null;

const initDb = (): DrizzleClient => {
    if (internalDb) return internalDb;

    const connectionString =
        env.DATABASE_URL ||
        env.LOCAL_DB_URL ||
        env.DIRECT_URL;

    if (!connectionString) {
        throw new Error(`❌ Drizzle Error: No authorized database URL found in the ${env.NODE_ENV} vault.`);
    }

    const isPooled = !!env.DATABASE_URL;

    const pool = new pg.Pool({
        connectionString,
        max: isPooled ? 10 : 20
    });

    internalDb = drizzle(pool, { schema });
    return internalDb;
};

export const db = new Proxy({} as DrizzleClient, {
    get: (_target, prop) => {
        const client = initDb();
        return Reflect.get(client, prop);
    }
});