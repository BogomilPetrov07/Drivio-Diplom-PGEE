import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service.js";
import type { InstructorSchedulePayload, SchoolPersonInput } from "./dashboard.types.js";

export class DashboardController {
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

  static getSchoolDetails = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const school = await DashboardService.getSchoolDetails(req.user.id);
    if (!school) return res.status(404).json({ message: "School not found" });

    return res.json({ school });
  };

  static updateSchoolDetails = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const result = await DashboardService.updateSchoolDetails(req.user.id, req.body as { name: string; address: string; phone: string });

    if (result.status === "NOT_FOUND") return res.status(404).json({ message: "School not found" });
    if (result.status === "VALIDATION_ERROR") return res.status(400).json({ message: "Name, address and phone are required" });
    if (result.status === "NAME_TAKEN") return res.status(409).json({ message: "School name already in use" });

    return res.json({ school: result.school });
  };

  static listSchoolPeople = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const people = await DashboardService.listSchoolPeople(req.user.id);
    if (people === null) return res.status(404).json({ message: "School not found" });

    return res.json({ people });
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
