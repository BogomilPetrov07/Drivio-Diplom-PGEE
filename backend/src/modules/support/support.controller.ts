import { Request, Response } from "express";
import { db } from "../../config/drizzle.js";
import { users } from "../../../drizzle/schemas/index.js";
import { eq } from "drizzle-orm";
import { SupportService } from "./support.service.js";

export class SupportController {
  static submitPublicQuestion = async (req: Request, res: Response) => {
    const { name, email, question } = req.body ?? {};
    if (!name || !email || !question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const thread = await SupportService.createThread({
      source: "PUBLIC",
      requesterName: String(name),
      requesterEmail: String(email),
      question: String(question),
    });

    return res.status(201).json({ message: "Question submitted", threadId: thread.id });
  };

  static submitUserQuestion = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const { question } = req.body ?? {};
    if (!question) return res.status(400).json({ message: "Question is required" });

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: { id: true, username: true, email: true },
    });

    if (!currentUser?.email) {
      return res.status(400).json({ message: "Current user has no email configured" });
    }

    const thread = await SupportService.createThread({
      source: "USER_DASHBOARD",
      requesterName: currentUser.username,
      requesterEmail: currentUser.email,
      requesterUserId: currentUser.id,
      question: String(question),
    });

    return res.status(201).json({ message: "Question submitted", threadId: thread.id });
  };

  static listAdminThreads = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threads = await SupportService.listAdminThreads();
    return res.status(200).json({ threads });
  };

  static getAdminThreadMessages = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const result = await SupportService.getThreadMessages(threadId);
    if (!result) return res.status(404).json({ message: "Thread not found" });
    return res.status(200).json(result);
  };

  static replyAsAdmin = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const { body } = req.body ?? {};
    if (!body) return res.status(400).json({ message: "Reply body is required" });

    const message = await SupportService.replyAsAdmin({
      threadId,
      adminUserId: req.user.id,
      body: String(body),
    });
    if (!message) return res.status(404).json({ message: "Thread not found, invalid input, or external thread" });

    return res.status(201).json({ message: "Reply sent" });
  };

  static closeAsAdmin = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const closed = await SupportService.closeThread({
      threadId,
      closedByUserId: req.user.id,
      actorType: "SUPERADMIN",
    });
    if (!closed.ok && closed.reason === "NOT_FOUND") return res.status(404).json({ message: "Thread not found" });
    if (!closed.ok && closed.reason === "REOPEN_WINDOW_EXPIRED") {
      return res.status(400).json({ message: "Ticket can only be reopened within 30 days from first close" });
    }
    if (!closed.ok) return res.status(400).json({ message: "Ticket status change failed" });
    return res.status(200).json({ message: closed.action === "reopened" ? "Ticket reopened" : "Ticket closed" });
  };

  static deleteClosedAsAdmin = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const deleted = await SupportService.deleteClosedThreadAsAdmin(threadId);
    if (!deleted.ok && deleted.reason === "NOT_FOUND") return res.status(404).json({ message: "Thread not found" });
    if (!deleted.ok && deleted.reason === "NOT_CLOSED") return res.status(400).json({ message: "Only closed tickets can be deleted" });
    return res.status(200).json({ message: "Ticket deleted" });
  };

  static listUserThreads = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threads = await SupportService.listUserThreads(req.user.id);
    return res.status(200).json({ threads });
  };

  static getUserThreadMessages = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const result = await SupportService.getUserThreadMessages(req.user.id, threadId);
    if (!result) return res.status(404).json({ message: "Thread not found" });
    return res.status(200).json(result);
  };

  static replyAsUser = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const threadId = String(req.params.threadId ?? "");
    const { body } = req.body ?? {};
    if (!body) return res.status(400).json({ message: "Reply body is required" });

    const message = await SupportService.replyAsUser({
      threadId,
      userId: req.user.id,
      body: String(body),
    });
    if (!message) return res.status(404).json({ message: "Thread not found or invalid input" });

    return res.status(201).json({ message: "Reply sent" });
  };

  static receiveInboundReply = async (req: Request, res: Response) => {
    const from = String(req.body?.from ?? "");
    const subject = String(req.body?.subject ?? "");
    const body = String(req.body?.text ?? req.body?.body ?? "");
    if (!from || !subject || !body) return res.status(400).json({ message: "Invalid payload" });

    const created = await SupportService.receiveInboundReply(from, subject, body);
    if (!created) return res.status(404).json({ message: "No matching thread found" });

    return res.status(201).json({ message: "Inbound reply attached" });
  };
}
