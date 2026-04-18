import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/authn.middleware.js";
import { authorizeMiddleware } from "../../middlewares/authz.middleware.js";
import { OnboardingController } from "./onboarding.controller.js";

const router = Router();

router.post("/request", OnboardingController.requestJoin);
router.post("/complete", OnboardingController.complete);
router.get("/setup-session", OnboardingController.getSetupSession);

router.get("/pending", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), OnboardingController.listPending);
router.post("/approve", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), OnboardingController.approve);

export default router;
