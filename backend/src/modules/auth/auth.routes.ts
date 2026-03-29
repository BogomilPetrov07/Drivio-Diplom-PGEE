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
router.get("/logout", AuthController.logout);
router.use(authenticateMiddleware);
router.get("/hello", AuthController.hello);
router.post("/sendEmail", AuthController.sendEmail);
router.post("/rotate", authorizeMiddleware(["SUPERADMIN"]), AuthController.rotatePepper);
router.get("/auditLog", authorizeMiddleware(["SUPERADMIN"]), AuthController.auditLog)

export default router;
