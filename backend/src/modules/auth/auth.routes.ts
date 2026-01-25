import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import {authnMiddleware} from "../../middlewares/authn.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.use(authnMiddleware);
router.post("/sendEmail", AuthController.sendEmail)
router.get("/refresh", AuthController.refreshAccessToken)
router.get("/logout", AuthController.logout);

export default router;
