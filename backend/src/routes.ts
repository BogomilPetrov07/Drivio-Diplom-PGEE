import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";
import supportRoutes from "./modules/support/support.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import publicRoutes from "./modules/public/public.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/support", supportRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/public", publicRoutes);

export default router;
