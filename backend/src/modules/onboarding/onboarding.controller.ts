import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service.js";

export class OnboardingController {
  static requestJoin = async (req: Request, res: Response) => {
    const { schoolName, schoolRegion, schoolCity, schoolAddress, schoolPhone, contactName, contactEmail } = req.body ?? {};
    if (!schoolName || !schoolRegion || !schoolCity || !schoolAddress || !schoolPhone || !contactEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await OnboardingService.createJoinRequest({ schoolName, schoolRegion, schoolCity, schoolAddress, schoolPhone, contactName, contactEmail });
    if (result.status === "CONTACT_EMAIL_EXISTS") {
      return res.status(409).json({ message: "A request or account with this email already exists" });
    }

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

  static getSetupSession = async (req: Request, res: Response) => {
    const token = String(req.query.token ?? "");
    if (!token) return res.status(400).json({ message: "token is required" });

    const session = await OnboardingService.getSetupSession(token);
    if (!session) return res.status(400).json({ message: "Invalid or expired setup token" });

    return res.status(200).json(session);
  };

  static complete = async (req: Request, res: Response) => {
    const { token, username, password, email, name, phone, wantsInstructorPrivileges, schoolName, schoolRegion, schoolCity, schoolAddress, schoolPhone } = req.body ?? {};
    if (!token || !username || !password || !email || !name || !schoolName || !schoolRegion || !schoolCity || !schoolAddress || !schoolPhone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await OnboardingService.completeSetup({
      token,
      username,
      password,
      email,
      name,
      phone,
      wantsInstructorPrivileges: Boolean(wantsInstructorPrivileges),
      schoolName,
      schoolRegion,
      schoolCity,
      schoolAddress,
      schoolPhone,
    });

    if (result.status === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(400).json({ message: "Invalid or expired setup token" });
    }
    if (result.status === "TOKEN_LIMIT_REACHED") {
      return res.status(400).json({ message: "Setup token usage limit reached" });
    }
    if (result.status === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username is already taken" });
    }
    if (result.status === "EMAIL_TAKEN") {
      return res.status(409).json({ message: "Email is already taken" });
    }

    return res.status(201).json({ message: "Driving school admin account created", schoolId: result.schoolId, adminUserId: result.adminUserId });
  };

  static getUserProfileSetupSession = async (req: Request, res: Response) => {
    const token = String(req.query.token ?? "");
    if (!token) return res.status(400).json({ message: "token is required" });

    const result = await OnboardingService.getUserProfileSetupSession(token);
    if (result.status === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(400).json({ message: "Invalid or expired setup token" });
    }
    if (result.status === "TOKEN_LIMIT_REACHED") {
      return res.status(400).json({ message: "Setup token usage limit reached" });
    }

    return res.status(200).json(result);
  };

  static completeUserProfileSetup = async (req: Request, res: Response) => {
    const { token, username, password, email, name } = req.body ?? {};
    if (!token || !username || !password || !email || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await OnboardingService.completeUserProfileSetup({
      token,
      username,
      password,
      email,
      name,
    });

    if (result.status === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(400).json({ message: "Invalid or expired setup token" });
    }
    if (result.status === "TOKEN_LIMIT_REACHED") {
      return res.status(400).json({ message: "Setup token usage limit reached" });
    }
    if (result.status === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username is already taken" });
    }
    if (result.status === "EMAIL_TAKEN") {
      return res.status(409).json({ message: "Email is already taken" });
    }

    return res.status(200).json({ message: "Profile setup completed", userId: result.userId });
  };
}
