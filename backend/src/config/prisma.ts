import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '@prisma/client';
import {env} from './env.js';
import pg from 'pg';

let internalPrisma: PrismaClient | null = null;

const initPrisma = (): PrismaClient => {
    if (internalPrisma) return internalPrisma;

    const environment = env.NODE_ENV;

    let connectionString: string | undefined = "";

    switch (environment) {
        case 'development':
            connectionString = env.LOCAL_DB_URL;
            break;

        case 'production':
            connectionString = env.DATABASE_URL;
            break;

        case 'test':
            connectionString = env.DATABASE_URL;
            break;
    }

    if (!connectionString) {
        throw new Error("❌ Prisma Proxy: No connection string found. Is Infisical initialized?");
    }

    const pool = new pg.Pool({connectionString});
    const adapter = new PrismaPg(pool);

    internalPrisma = new PrismaClient({adapter});
    return internalPrisma;
};

export const prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
        const client = initPrisma();
        // Reflect is used to ensure methods like $connect and models work correctly
        return Reflect.get(client, prop);
    }
});