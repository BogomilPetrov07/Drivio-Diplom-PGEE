import webpush from 'web-push';
import {env} from './env.js'


const vapidPublicKey = env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
const vapidEmail = env.VAPID_EMAIL;

try {
    webpush.setVapidDetails(
        vapidEmail,
        vapidPublicKey,
        vapidPrivateKey
    );
    console.log("✅ Web Push config is ready.");
} catch (error) {
    console.error(error);
}

export default webpush;
