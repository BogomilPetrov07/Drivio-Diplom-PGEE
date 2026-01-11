import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import {authMiddleware} from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.use(authMiddleware);
router.get("/logout", AuthController.logout);
router.post("/sendEmail", AuthController.sendEmail)

export default router;
