import { Router } from "express";
import { PublicController } from "./public.controller.js";

const router = Router();

router.get("/schools", PublicController.listSchools);

export default router;
