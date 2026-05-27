import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service.js";
import type {
  InstructorSchedulePayload,
  SchoolCarInput,
  SchoolPersonInput,
  SendInstructorSchedulePayload,
  StudentAvailabilityPayload,
} from "./dashboard.types.js";

export class DashboardController {
  static getInstructorStudents = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.listInstructorStudents(req.user.id);
    if (result === null) return res.status(404).json({ message: "Instructor profile not found" });

    return res.json(result);
  };

  static getInstructorSchedule = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.fetchInstructorSchedule(req.user.id);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "EMPTY") return res.status(200).json({ schedule: null });
    return res.json({ schedule: result.schedule });
  };

  static saveInstructorSchedule = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.saveInstructorSchedule(req.user.id, req.body as InstructorSchedulePayload);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid schedule payload" });
    return res.json({ schedule: result.schedule });
  };

  static getInstructorScheduleWorkflow = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.getInstructorScheduleWorkflow(req.user.id, String(req.query.weekStartDate ?? ""));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid weekStartDate" });
    return res.json({ workflow: result.workflow });
  };

  static sendInstructorScheduleToStudents = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.sendInstructorScheduleToStudents(req.user.id, req.body as SendInstructorSchedulePayload);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid schedule send payload" });
    return res.json({ workflow: result.workflow });
  };

  static allocateInstructorSchedule = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const cycleId = typeof req.body?.cycleId === "string" ? req.body.cycleId : undefined;
    const result = await DashboardService.allocateInstructorSchedule(req.user.id, cycleId);

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "CYCLE_NOT_FOUND") return res.status(404).json({ message: "Schedule cycle not found" });
    if (result.status === "NO_ACTIVE_STUDENTS") return res.status(400).json({ message: "No active students to allocate" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid allocation payload" });
    return res.json({ allocation: result.allocation });
  };

  static listInstructorLessons = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.listInstructorLessons(req.user.id, String(req.query.weekStartDate ?? ""));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid weekStartDate" });
    return res.json({ lessons: result.lessons });
  };

  static getInstructorLessonCandidates = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.getInstructorLessonCandidates(req.user.id, String(req.params.timeSlotId));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "LESSON_NOT_FOUND") return res.status(404).json({ message: "Lesson slot not found" });
    return res.json({ details: result.details });
  };

  static issueInstructorLessonStartCode = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.issueInstructorLessonStartCode(req.user.id, String(req.params.timeSlotId));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "LESSON_NOT_FOUND") return res.status(404).json({ message: "Lesson slot not found" });
    if (result.status === "UNASSIGNED_SLOT") return res.status(400).json({ message: "Lesson slot is not assigned to a student" });
    if (result.status === "INVALID_STATE") return res.status(409).json({ message: "Lesson is already active or completed" });
    return res.json(result.verification);
  };

  static markInstructorLessonFailed = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.markInstructorLessonFailed(req.user.id, String(req.params.timeSlotId));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Instructor profile not found" });
    if (result.status === "LESSON_NOT_FOUND") return res.status(404).json({ message: "Lesson slot not found" });
    if (result.status === "INVALID_STATE") return res.status(409).json({ message: "Lesson is not in active state" });
    return res.json({ message: "Lesson marked as failed" });
  };

  static getStudentScheduleCycle = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.fetchStudentScheduleCycle(req.user.id, String(req.query.weekStartDate ?? ""));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid weekStartDate" });
    if (result.status === "EMPTY") return res.json({ schedule: null });
    return res.json({ schedule: result.schedule });
  };

  static submitStudentScheduleAvailability = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.submitStudentScheduleAvailability(req.user.id, req.body as StudentAvailabilityPayload);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    if (result.status === "CYCLE_NOT_FOUND") return res.status(404).json({ message: "Schedule cycle not found" });
    if (result.status === "FORBIDDEN") return res.status(403).json({ message: "You cannot respond to this cycle" });
    if (result.status === "INVALID_STATE") return res.status(409).json({ message: "Cycle is not accepting responses" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid availability payload" });
    return res.json({ summary: result.summary });
  };

  static listStudentLessons = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.listStudentLessons(req.user.id, String(req.query.weekStartDate ?? ""));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid weekStartDate" });
    return res.json({ lessons: result.lessons });
  };

  static getStudentProgress = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.getStudentProgress(req.user.id);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    return res.json({ progress: result.progress });
  };

  static getStudentInstructors = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.getStudentInstructors(req.user.id);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    return res.json({ summary: result.summary });
  };

  static verifyStudentLessonStartCode = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const result = await DashboardService.verifyStudentLessonStartCode(req.user.id, String(req.params.timeSlotId), code);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "Student profile not found" });
    if (result.status === "LESSON_NOT_FOUND") return res.status(404).json({ message: "Lesson slot not found" });
    if (result.status === "START_CODE_EXPIRED") return res.status(409).json({ message: "Start code has expired" });
    if (result.status === "INVALID_CODE") return res.status(400).json({ message: "Invalid start code" });
    if (result.status === "INVALID_STATE") return res.status(409).json({ message: "Lesson cannot be started from current state" });
    return res.json({ message: "Lesson started successfully" });
  };

  static getSchoolDetails = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const school = await DashboardService.getSchoolDetails(req.user.id);
    if (!school) return res.status(404).json({ message: "School not found" });

    return res.json({ school });
  };

  static updateSchoolDetails = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.updateSchoolDetails(req.user.id, req.body as { name: string; region: string; city: string; address: string; phone: string; rating?: number });

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Name, region, city, address and phone are required" });
    if (result.status === "NAME_TAKEN") return res.status(409).json({ message: "School name already in use" });

    return res.json({ school: result.school });
  };

  static listSchoolPeople = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const people = await DashboardService.listSchoolPeople(req.user.id);
    if (people === null) return res.status(404).json({ message: "School not found" });

    return res.json({ people });
  };

  static listSchoolCars = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const items = await DashboardService.listSchoolCars(req.user.id);
    if (items === null) return res.status(404).json({ message: "School not found" });
    return res.json({ cars: items });
  };

  static createSchoolCar = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.createSchoolCar(req.user.id, req.body as SchoolCarInput);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid car payload" });
    return res.status(201).json({ car: result.car });
  };

  static updateSchoolCar = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.updateSchoolCar(req.user.id, String(req.params.carId), req.body as SchoolCarInput);
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "CAR_NOT_FOUND") return res.status(404).json({ message: "Car not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Invalid car payload" });
    return res.json({ car: result.car });
  };

  static deleteSchoolCar = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const result = await DashboardService.deleteSchoolCar(req.user.id, String(req.params.carId));
    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "CAR_NOT_FOUND") return res.status(404).json({ message: "Car not found" });
    return res.json({ message: "Car deleted" });
  };

  static createSchoolPerson = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.createSchoolPerson(req.user.id, req.body as SchoolPersonInput);

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Email and name are required" });
    if (result.status === "INVALID_ROLE") return res.status(400).json({ message: "Invalid role" });
    if (result.status === "EMAIL_TAKEN") return res.status(409).json({ message: "Email already in use" });
    if (result.status === "MISSING_INSTRUCTOR") return res.status(400).json({ message: "Instructor is required for students" });
    if (result.status === "INVALID_INSTRUCTOR") return res.status(400).json({ message: "Invalid instructor" });

    return res.status(201).json({ message: "Person created", userId: result.userId });
  };

  static updateSchoolPerson = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.updateSchoolPerson(req.user.id, String(req.params.userId), req.body as SchoolPersonInput);

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "USER_NOT_FOUND") return res.status(404).json({ message: "Person not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Email and name are required" });
    if (result.status === "INVALID_ROLE") return res.status(400).json({ message: "Invalid role" });
    if (result.status === "EMAIL_TAKEN") return res.status(409).json({ message: "Email already in use" });
    if (result.status === "MISSING_INSTRUCTOR") return res.status(400).json({ message: "Instructor is required for students" });
    if (result.status === "INVALID_INSTRUCTOR") return res.status(400).json({ message: "Invalid instructor" });
    if (result.status === "SELF_ROLE_DOWNGRADE_FORBIDDEN") return res.status(400).json({ message: "You cannot remove your own school admin role" });

    return res.json({ message: "Person updated", userId: result.userId });
  };

  static deleteSchoolPerson = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.deleteSchoolPerson(req.user.id, String(req.params.userId));

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "USER_NOT_FOUND") return res.status(404).json({ message: "Person not found" });
    if (result.status === "CANNOT_DELETE_SELF") return res.status(400).json({ message: "You cannot delete your own account" });

    return res.json({ message: "Person deleted" });
  };
}
