import {Redis} from "ioredis";
import {env} from "./env.js";

let internalRedis: Redis | null = null;

const initRedis = (): Redis => {
    if (internalRedis) return internalRedis;

    const environment = env.NODE_ENV;
    let url: string | undefined = "";
    switch (environment) {
        case 'dev':
            url = env.DOCKER_REDIS_URL;
            break;

        case 'staging':
        case 'test':
        case 'prod':
            url = env.UPSTASH_REDIS_URL;
            break;
    }

    if (!url) {
        throw new Error("❌ Redis Proxy: Missing redis URL. Is Infisical initialized?");
    }

    // Initialize the actual ioredis instance
    internalRedis = new Redis(url, {
        // Optional: Good for cloud providers like Upstash
        maxRetriesPerRequest: null,
    });

    internalRedis.on("error", (err) => console.error("Redis Error:", err));
    internalRedis.on("connect", () => console.log("✨ Connected to Redis"));

    return internalRedis;
};

export const redis = new Proxy({} as Redis, {
    get: (_target, prop) => {
        const instance = initRedis();
        const value = Reflect.get(instance, prop);

        // ioredis methods need to be bound to the instance to work correctly
        return typeof value === "function" ? value.bind(instance) : value;
    }
});