import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/authn.middleware.js";
import { authorizeMiddleware } from "../../middlewares/authz.middleware.js";
import { errorMiddleware } from "../../middlewares/error.middleware.js";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(errorMiddleware);
router.use(authenticateMiddleware);

router.get("/instructor/schedule", authorizeMiddleware(["INSTRUCTOR"]), DashboardController.getInstructorSchedule);
router.put("/instructor/schedule", authorizeMiddleware(["INSTRUCTOR"]), DashboardController.saveInstructorSchedule);

router.use(authorizeMiddleware(["SCHOOLADMIN"]));

router.get("/school-admin/school", DashboardController.getSchoolDetails);
router.patch("/school-admin/school", DashboardController.updateSchoolDetails);
router.get("/school-admin/people", DashboardController.listSchoolPeople);
router.post("/school-admin/people", DashboardController.createSchoolPerson);
router.patch("/school-admin/people/:userId", DashboardController.updateSchoolPerson);
router.delete("/school-admin/people/:userId", DashboardController.deleteSchoolPerson);

export default router;
