import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import {authnMiddleware} from "../../middlewares/authn.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/sendEmail", AuthController.sendEmail)
router.get("/logout", AuthController.logout);
router.use(authnMiddleware);

export default router;
