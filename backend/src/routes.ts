import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";
import supportRoutes from "./modules/support/support.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/support", supportRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
