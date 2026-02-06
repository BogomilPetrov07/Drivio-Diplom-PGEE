import cron from 'node-cron';
import {REDIS_KEYS} from "./redis-keys";

export const initCronJobs = async () => {
    const {AuthService} = await import("../modules/auth/auth.service.js");
    const {redis} = await import("./redis.js");


    // 1. Every 7 days (Runs at 00:00 every Sunday)
    cron.schedule('0 0 * * 0', async () => {
        console.log('Running weekly task...');
        try {
            const redisResponse = await redis.get(`${REDIS_KEYS.COOLDOWN("refresh")}`) === null;
            if (redisResponse) {
                await AuthService.rotatePepper("refresh");
            } else {
                console.log('Revoking monthly task...');
                console.log("Admin already ran monthly task!");
            }
        } catch (error) {
            console.error(error);
        }
    });


    // 2. Every 30 days (Runs at 00:00 on the 1st of every month)
    cron.schedule('0 0 1 * *', async () => {
        console.log('Running monthly task...');
        try {
            const redisResponse = await redis.get(`${REDIS_KEYS.COOLDOWN("session")}`) === null;
            if (redisResponse) {
                await AuthService.rotatePepper("session");
            } else {
                console.log('Revoking monthly task...');
                console.log("Admin already ran monthly task!");
            }
        } catch (error) {
            console.error(error);
        }
    });
};