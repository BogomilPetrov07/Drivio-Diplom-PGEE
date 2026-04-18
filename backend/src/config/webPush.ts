import webpush from "web-push";
import { env } from "./env.js";

const vapidPublicKey = env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
const vapidEmail = env.VAPID_EMAIL;

try {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    console.warn("Web Push config skipped: missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_EMAIL.");
  } else {
    const subject = vapidEmail.startsWith("mailto:") || vapidEmail.startsWith("https://")
      ? vapidEmail
      : `mailto:${vapidEmail}`;

    webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
    console.log("Web Push config is ready.");
  }
} catch (error) {
  console.error("Web Push config failed:", error);
}

export default webpush;
