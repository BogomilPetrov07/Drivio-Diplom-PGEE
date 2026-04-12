import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service.js";

export class OnboardingController {
  static requestJoin = async (req: Request, res: Response) => {
    const { schoolName, schoolAddress, schoolPhone, contactName, contactEmail } = req.body ?? {};
    if (!schoolName || !schoolAddress || !schoolPhone || !contactName || !contactEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await OnboardingService.createJoinRequest({ schoolName, schoolAddress, schoolPhone, contactName, contactEmail });
    return res.status(201).json({ message: "Request submitted" });
  };

  static listPending = async (_req: Request, res: Response) => {
    const requests = await OnboardingService.listPendingRequests();
    return res.status(200).json({ requests });
  };

  static approve = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const { requestId } = req.body ?? {};
    if (!requestId) return res.status(400).json({ message: "requestId is required" });

    const approved = await OnboardingService.approveRequest({
      requestId,
      reviewerUserId: req.user.id,
    });

    if (!approved) return res.status(404).json({ message: "Pending request not found" });
    return res.status(200).json({ message: "Request approved and setup email sent" });
  };

  static complete = async (req: Request, res: Response) => {
    const { token, username, password, schoolName, schoolAddress, schoolPhone } = req.body ?? {};
    if (!token || !username || !password || !schoolName || !schoolAddress || !schoolPhone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await OnboardingService.completeSetup({
      token,
      username,
      password,
      schoolName,
      schoolAddress,
      schoolPhone,
    });

    if (!result) return res.status(400).json({ message: "Invalid or expired setup token" });
    return res.status(201).json({ message: "Driving school admin account created" });
  };
}
