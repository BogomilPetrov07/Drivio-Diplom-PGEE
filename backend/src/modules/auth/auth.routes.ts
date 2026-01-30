import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import {authenticateMiddleware} from "../../middlewares/authn.middleware";
import {authorizeMiddleware} from "../../middlewares/authz.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.use(authenticateMiddleware);
router.post("/sendEmail", AuthController.sendEmail);
router.get("/refresh", AuthController.refreshAccessToken);
router.post("/rotate", authorizeMiddleware(["SUPERADMIN"]), AuthController.rotatePepper);
router.get("/logout", AuthController.logout);

export default router;
