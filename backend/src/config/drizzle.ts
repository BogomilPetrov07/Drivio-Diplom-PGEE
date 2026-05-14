import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';
import * as schema from '../../drizzle/schemas/index.js';
import { resolveRuntimeDbConnectionString } from '../scripts/db-connection-log.js';

type DrizzleClient = NodePgDatabase<typeof schema>;

let internalDb: DrizzleClient | null = null;
let internalPool: pg.Pool | null = null;
let internalConnectionString: string | null = null;

const initDb = (): DrizzleClient => {
    if (internalDb) return internalDb;

    const connectionString = resolveRuntimeDbConnectionString();

    if (!connectionString) {
        throw new Error(`Drizzle error: no authorized database URL found in the ${env.NODE_ENV} vault.`);
    }

    const isPooled = !!env.DATABASE_URL;
    const pool = new pg.Pool({
        connectionString,
        max: isPooled ? 10 : 20,
    });

    internalPool = pool;
    internalConnectionString = connectionString;
    internalDb = drizzle(pool, { schema });
    return internalDb;
};

export const initializeDb = async () => {
    initDb();

    if (!internalPool) {
        throw new Error('Database pool was not initialized.');
    }

    await internalPool.query('SELECT 1');

    if (process.env.npm_lifecycle_event === 'dev' && internalConnectionString) {
        console.log(`PostgreSQL connection: ${internalConnectionString}`);
    }
};

export const db = new Proxy({} as DrizzleClient, {
    get: (_target, prop) => {
        const client = initDb();
        return Reflect.get(client, prop);
    },
});
