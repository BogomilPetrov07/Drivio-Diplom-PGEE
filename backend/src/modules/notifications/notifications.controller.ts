import { Request, Response } from "express";
import { NotificationsService } from "./notifications.service.js";
import { env } from "../../config/env.js";

export class NotificationsController {
  static listMine = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const limitRaw = Number(req.query.limit ?? 30);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 30;
    const data = await NotificationsService.listForUser(req.user.id, limit);
    return res.status(200).json(data);
  };

  static markAllRead = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    await NotificationsService.markAllRead(req.user.id);
    return res.status(200).json({ message: "Notifications marked as read" });
  };

  static deleteMine = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const notificationId = String(req.params.notificationId ?? "");
    if (!notificationId) return res.status(400).json({ message: "Notification id is required" });

    const deleted = await NotificationsService.deleteOneForUser(req.user.id, notificationId);
    if (!deleted) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ message: "Notification deleted" });
  };

  static savePushSubscription = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    await NotificationsService.upsertPushSubscription(req.user.id, subscription, req.get("user-agent") ?? undefined);
    return res.status(201).json({ message: "Push subscription saved" });
  };

  static removePushSubscription = async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const endpoint = String(req.body?.endpoint ?? "");
    if (!endpoint) return res.status(400).json({ message: "Endpoint is required" });

    await NotificationsService.removePushSubscription(endpoint, req.user.id);
    return res.status(200).json({ message: "Push subscription removed" });
  };

  static getPushPublicKey = async (_req: Request, res: Response) => {
    return res.status(200).json({ publicKey: env.VAPID_PUBLIC_KEY });
  };
}
