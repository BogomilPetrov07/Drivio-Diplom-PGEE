import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { notifications, pushSubscriptions, users } from "../../../drizzle/schemas/index.js";
import { emitToUser } from "../../realtime/socket.js";
import webpush from "../../config/webPush.js";
import { redis } from "../../config/redis.js";
import { REDIS_KEYS } from "../../config/redis-keys.js";

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { cause?: { code?: string } };
  return maybe.cause?.code === "42P01";
}

export type NotificationDTO = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  read: boolean;
  createdAt: Date;
  metadata: unknown;
};

export class NotificationsService {
  private static CACHE_TTL_SECONDS = 20;

  private static async getCachedList(userId: string, limit: number) {
    const listKey = REDIS_KEYS.NOTIFICATIONS_LIST(userId, limit);
    const unreadKey = REDIS_KEYS.NOTIFICATIONS_UNREAD_COUNT(userId);
    try {
      const [listRaw, unreadRaw] = await redis.mget(listKey, unreadKey);
      if (!listRaw || unreadRaw === null) return null;
      const parsed = JSON.parse(listRaw) as { items: Array<NotificationDTO> };
      const unreadCount = Number(unreadRaw);
      if (!Number.isFinite(unreadCount)) return null;
      return { items: parsed.items, unreadCount };
    } catch {
      return null;
    }
  }

  private static async setCachedList(userId: string, limit: number, payload: { items: Array<NotificationDTO>; unreadCount: number }) {
    const listKey = REDIS_KEYS.NOTIFICATIONS_LIST(userId, limit);
    const unreadKey = REDIS_KEYS.NOTIFICATIONS_UNREAD_COUNT(userId);
    try {
      await redis
        .multi()
        .set(listKey, JSON.stringify({ items: payload.items }), "EX", this.CACHE_TTL_SECONDS)
        .set(unreadKey, String(payload.unreadCount), "EX", this.CACHE_TTL_SECONDS)
        .exec();
    } catch {
      // Redis is an accelerator only; skip cache failures.
    }
  }

  private static async invalidateUserCache(userId: string, limit?: number) {
    try {
      const unreadKey = REDIS_KEYS.NOTIFICATIONS_UNREAD_COUNT(userId);
      if (typeof limit === "number") {
        await redis.del(REDIS_KEYS.NOTIFICATIONS_LIST(userId, limit), unreadKey);
        return;
      }
      const keys = await redis.keys(`notifications:list:${userId}:*`);
      const allKeys = [...keys, unreadKey];
      if (allKeys.length) await redis.del(...allKeys);
    } catch {
      // Ignore Redis failures; DB remains source of truth.
    }
  }

  static async listForUser(userId: string, limit = 30) {
    const cached = await this.getCachedList(userId, limit);
    if (cached) return cached;

    try {
      const items = await db.query.notifications.findMany({
        where: eq(notifications.recipientUserId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit,
      });

      const unreadCount = await db.$count(
        notifications,
        and(eq(notifications.recipientUserId, userId), eq(notifications.read, false)),
      );

      const payload = { items, unreadCount };
      await this.setCachedList(userId, limit, payload);
      return payload;
    } catch (error) {
      if (isMissingRelationError(error)) return { items: [], unreadCount: 0 };
      throw error;
    }
  }

  static async markAllRead(userId: string) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.recipientUserId, userId), eq(notifications.read, false)));
      await this.invalidateUserCache(userId);
    } catch (error) {
      if (isMissingRelationError(error)) return;
      throw error;
    }
  }

  static async deleteOneForUser(userId: string, notificationId: string) {
    try {
      const deleted = await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.recipientUserId, userId)))
        .returning({ id: notifications.id });

      await this.invalidateUserCache(userId);
      return deleted.length > 0;
    } catch (error) {
      if (isMissingRelationError(error)) return false;
      throw error;
    }
  }

  static async createForUser(params: {
    userId: string;
    type: string;
    title?: string;
    body?: string;
    metadata?: unknown;
    push?: boolean;
  }) {
    let created: NotificationDTO;
    try {
      [created] = await db
        .insert(notifications)
        .values({
          recipientUserId: params.userId,
          type: params.type,
          title: params.title ?? null,
          body: params.body ?? null,
          metadata: params.metadata ?? null,
        })
        .returning();
    } catch (error) {
      if (isMissingRelationError(error)) return null;
      throw error;
    }

    await this.invalidateUserCache(params.userId);
    emitToUser(params.userId, "notification:new", created);

    if (params.push) {
      void this.sendPushToUser(params.userId, {
        title: params.title ?? params.type,
        body: params.body ?? "",
        data: params.metadata ?? null,
      });
    }

    return created;
  }

  static async createForRoles(params: {
    roles: Array<"SUPERADMIN" | "SCHOOLADMIN" | "INSTRUCTOR" | "STUDENT">;
    type: string;
    title?: string;
    body?: string;
    metadata?: unknown;
    push?: boolean;
  }) {
    if (!params.roles.length) return;
    let roleUsers: Array<{ id: string }> = [];
    try {
      roleUsers = await db.query.users.findMany({
        where: inArray(users.role, params.roles),
        columns: { id: true },
      });
    } catch (error) {
      if (isMissingRelationError(error)) return;
      throw error;
    }

    if (!roleUsers.length) return;

    await Promise.all(
      roleUsers.map((user) =>
        this.createForUser({
          userId: user.id,
          type: params.type,
          title: params.title,
          body: params.body,
          metadata: params.metadata,
          push: params.push,
        }),
      ),
    );
  }

  static async upsertPushSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
    let existing: typeof pushSubscriptions.$inferSelect | undefined;
    try {
      existing = await db.query.pushSubscriptions.findFirst({
        where: eq(pushSubscriptions.endpoint, subscription.endpoint),
      });
    } catch (error) {
      if (isMissingRelationError(error)) return;
      throw error;
    }

    if (existing) {
      await db
        .update(pushSubscriptions)
        .set({
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: userAgent ?? null,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing.id));
      return;
    }

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
      updatedAt: new Date(),
    });
  }

  static async removePushSubscription(endpoint: string, userId: string) {
    try {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
    } catch (error) {
      if (isMissingRelationError(error)) return;
      throw error;
    }
  }

  static async sendPushToUser(userId: string, payload: { title: string; body: string; data?: unknown }) {
    let subs: Array<typeof pushSubscriptions.$inferSelect> = [];
    try {
      subs = await db.query.pushSubscriptions.findMany({
        where: eq(pushSubscriptions.userId, userId),
      });
    } catch (error) {
      if (isMissingRelationError(error)) return;
      throw error;
    }

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload),
          );
        } catch {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }),
    );
  }
}
