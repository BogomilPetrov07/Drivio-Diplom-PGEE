import cron from 'node-cron';
import {AuthService} from "../modules/auth/auth.service";

export const initCronJobs = () => {
    // 1. Every 7 days (Runs at 00:00 every Sunday)
    // Pattern: minute hour dayOfMonth month dayOfWeek
    cron.schedule('0 0 * * 0', async () => {
        console.log('Running weekly task...');
        await AuthService.rotatePepper(true);
    });

    // 2. Every 30 days (Runs at 00:00 on the 1st of every month)
    cron.schedule('0 0 1 * *', async () => {
        console.log('Running monthly task...');

        await AuthService.rotatePepper(false);
    });
};