import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);

export default router;
