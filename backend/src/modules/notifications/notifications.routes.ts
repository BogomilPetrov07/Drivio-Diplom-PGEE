import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";
import { authenticateMiddleware } from "../../middlewares/authn.middleware.js";

const router = Router();

router.use(authenticateMiddleware);
router.get("/me", NotificationsController.listMine);
router.post("/read-all", NotificationsController.markAllRead);
router.delete("/:notificationId", NotificationsController.deleteMine);
router.get("/push/public-key", NotificationsController.getPushPublicKey);
router.post("/push/subscribe", NotificationsController.savePushSubscription);
router.post("/push/unsubscribe", NotificationsController.removePushSubscription);

export default router;
