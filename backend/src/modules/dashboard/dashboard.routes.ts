import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/authn.middleware.js";
import { authorizeMiddleware } from "../../middlewares/authz.middleware.js";
import { errorMiddleware } from "../../middlewares/error.middleware.js";
import { DashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(errorMiddleware);
router.use(authenticateMiddleware);

router.get("/instructor/students", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.getInstructorStudents);
router.get("/instructor/schedule", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.getInstructorSchedule);
router.put("/instructor/schedule", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.saveInstructorSchedule);
router.get("/instructor/schedule/workflow", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.getInstructorScheduleWorkflow);
router.post("/instructor/schedule/send", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.sendInstructorScheduleToStudents);
router.post("/instructor/schedule/allocate", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.allocateInstructorSchedule);
router.get("/instructor/lessons", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.listInstructorLessons);
router.get("/instructor/lessons/:timeSlotId/candidates", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.getInstructorLessonCandidates);
router.post("/instructor/lessons/:timeSlotId/start-code", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.issueInstructorLessonStartCode);
router.post("/instructor/lessons/:timeSlotId/mark-failed", authorizeMiddleware(["INSTRUCTOR", "SCHOOLADMIN"]), DashboardController.markInstructorLessonFailed);

router.get("/student/schedule", authorizeMiddleware(["STUDENT"]), DashboardController.getStudentScheduleCycle);
router.post("/student/schedule/availability", authorizeMiddleware(["STUDENT"]), DashboardController.submitStudentScheduleAvailability);
router.get("/student/lessons", authorizeMiddleware(["STUDENT"]), DashboardController.listStudentLessons);
router.get("/student/progress", authorizeMiddleware(["STUDENT"]), DashboardController.getStudentProgress);
router.get("/student/instructors", authorizeMiddleware(["STUDENT"]), DashboardController.getStudentInstructors);
router.post("/student/lessons/:timeSlotId/verify-start-code", authorizeMiddleware(["STUDENT"]), DashboardController.verifyStudentLessonStartCode);

router.use(authorizeMiddleware(["SCHOOLADMIN"]));

router.get("/school-admin/school", DashboardController.getSchoolDetails);
router.patch("/school-admin/school", DashboardController.updateSchoolDetails);
router.get("/school-admin/people", DashboardController.listSchoolPeople);
router.post("/school-admin/people", DashboardController.createSchoolPerson);
router.patch("/school-admin/people/:userId", DashboardController.updateSchoolPerson);
router.delete("/school-admin/people/:userId", DashboardController.deleteSchoolPerson);
router.get("/school-admin/cars", DashboardController.listSchoolCars);
router.post("/school-admin/cars", DashboardController.createSchoolCar);
router.patch("/school-admin/cars/:carId", DashboardController.updateSchoolCar);
router.delete("/school-admin/cars/:carId", DashboardController.deleteSchoolCar);

export default router;
