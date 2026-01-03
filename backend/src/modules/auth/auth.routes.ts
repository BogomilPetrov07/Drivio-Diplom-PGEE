import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/logout", AuthController.logout);
router.post("/sendEmail", AuthController.sendEmail)

export default router;
