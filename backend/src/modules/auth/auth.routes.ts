import {Router} from "express";
import {authenticateMiddleware} from "../../middlewares/authn.middleware.js";
import {authorizeMiddleware} from "../../middlewares/authz.middleware.js";
import {errorMiddleware} from "../../middlewares/error.middleware.js";
import {AuthController} from "./auth.controller.js";


const router = Router();

router.use(errorMiddleware);
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/refresh", AuthController.refreshAccessToken);
router.use(authenticateMiddleware);
router.post("/sendEmail", AuthController.sendEmail);
router.post("/rotate", authorizeMiddleware(["SUPERADMIN"]), AuthController.rotatePepper);
router.get("/auditLog", authorizeMiddleware(["SUPERADMIN"]), AuthController.auditLog)
router.get("/logout", AuthController.logout);

export default router;
