import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { supportMessages, supportThreads, users } from "../../../drizzle/schemas/index.js";
import {
  sendPublicQuestionConfirmationEmail,
  sendPublicTicketStatusEmail,
  sendPublicQuestionToSupport,
} from "../../utils/email.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { emitToRole, emitToUser } from "../../realtime/socket.js";

type Source = "PUBLIC" | "USER_DASHBOARD";

type CreateThreadInput = {
  source: Source;
  requesterName: string;
  requesterEmail: string;
  question: string;
  requesterUserId?: string;
};

type AdminReplyInput = {
  threadId: string;
  adminUserId: string;
  body: string;
};

type UserReplyInput = {
  threadId: string;
  userId: string;
  body: string;
};

type CloseThreadInput = {
  threadId: string;
  closedByUserId: string;
  actorType: "SUPERADMIN";
};

type CloseThreadResult =
  | { ok: true; action: "closed" | "reopened" }
  | { ok: false; reason: "NOT_FOUND" | "REOPEN_WINDOW_EXPIRED" };

export class SupportService {
  private static async resolveRequesterUserId(thread: {
    requesterUserId?: string | null;
    requesterEmail: string;
    source?: string;
  }) {
    if (thread.requesterUserId) return thread.requesterUserId;
    if (thread.source === "PUBLIC") return null;

    const match = await db.query.users.findFirst({
      where: eq(users.email, thread.requesterEmail.trim().toLowerCase()),
      columns: { id: true },
    });

    return match?.id ?? null;
  }

  private static emitThreadChanged(threadId: string, userId?: string | null) {
    emitToRole("SUPERADMIN", "support:thread-updated", { threadId });
    if (userId) {
      emitToUser(userId, "support:thread-updated", { threadId });
    }
  }

  static async createThread(input: CreateThreadInput) {
    const requesterName = input.requesterName.trim();
    const requesterEmail = input.requesterEmail.trim().toLowerCase();
    const question = input.question.trim();

    const created = await db.transaction(async (tx) => {
      const [thread] = await tx
        .insert(supportThreads)
        .values({
          source: input.source,
          requesterName,
          requesterEmail,
          requesterUserId: input.requesterUserId ?? null,
          status: "OPEN",
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [message] = await tx
        .insert(supportMessages)
        .values({
          threadId: thread.id,
          senderType: "USER",
          senderUserId: input.requesterUserId ?? null,
          senderName: requesterName,
          senderEmail: requesterEmail,
          via: input.source === "PUBLIC" ? "WEB" : "APP",
          body: question,
        })
        .returning();

      return { thread, message };
    });

    if (input.source === "PUBLIC") {
      await sendPublicQuestionToSupport(requesterName, requesterEmail, question, created.thread.id, input.source);
      await sendPublicQuestionConfirmationEmail(requesterEmail, requesterName, created.thread.id);
    }

    await NotificationsService.createForRoles({
      roles: ["SUPERADMIN"],
      type: "SUPPORT_TICKET_CREATED",
      title: "New support ticket",
      body: `${requesterName} created a support ticket.`,
      metadata: { threadId: created.thread.id, source: input.source },
      push: true,
    });

    if (input.requesterUserId) {
      await NotificationsService.createForUser({
        userId: input.requesterUserId,
        type: "SUPPORT_TICKET_CREATED",
        title: "Ticket created",
        body: "Your support ticket was created successfully.",
        metadata: { threadId: created.thread.id },
        push: true,
      });
    }

    this.emitThreadChanged(created.thread.id, input.requesterUserId ?? null);

    return created.thread;
  }

  static async listAdminThreads() {
    const threads = await db.query.supportThreads.findMany({
      orderBy: [desc(supportThreads.lastMessageAt)],
    });

    const enriched = await Promise.all(
      threads.map(async (thread) => {
        const latest = await db.query.supportMessages.findFirst({
          where: eq(supportMessages.threadId, thread.id),
          orderBy: [desc(supportMessages.createdAt)],
        });
        const first = await db.query.supportMessages.findFirst({
          where: and(eq(supportMessages.threadId, thread.id), ne(supportMessages.senderType, "SYSTEM")),
          orderBy: [asc(supportMessages.createdAt)],
        });

        let canReopen = false;
        if (thread.status === "CLOSED") {
          const firstCloseEvent = await db.query.supportMessages.findFirst({
            where: and(
              eq(supportMessages.threadId, thread.id),
              eq(supportMessages.senderType, "SYSTEM"),
              eq(supportMessages.body, "Ticket closed by support."),
            ),
            orderBy: [asc(supportMessages.createdAt)],
          });
          if (firstCloseEvent) {
            const now = Date.now();
            const firstCloseAt = new Date(firstCloseEvent.createdAt).getTime();
            canReopen = now - firstCloseAt <= 30 * 24 * 60 * 60 * 1000;
          }
        }

        return {
          ...thread,
          latestMessagePreview: latest?.body.slice(0, 140) ?? "",
          ticketSubject: first?.body.split("\n")[0]?.slice(0, 140) ?? "",
          canReopen,
        };
      }),
    );

    return enriched;
  }

  static async getThreadMessages(threadId: string) {
    const thread = await db.query.supportThreads.findFirst({ where: eq(supportThreads.id, threadId) });
    if (!thread) return null;

    const messages = await db.query.supportMessages.findMany({
      where: and(eq(supportMessages.threadId, threadId), ne(supportMessages.senderType, "SYSTEM")),
      orderBy: [supportMessages.createdAt],
    });

    return { thread, messages };
  }

  static async replyAsAdmin(input: AdminReplyInput) {
    const thread = await db.query.supportThreads.findFirst({
      where: eq(supportThreads.id, input.threadId),
    });
    if (!thread) return null;
    if (thread.source === "PUBLIC") return null;

    const admin = await db.query.users.findFirst({
      where: eq(users.id, input.adminUserId),
      columns: { id: true, username: true, email: true },
    });
    if (!admin) return null;

    const body = input.body.trim();
    if (!body) return null;

    const [message] = await db
      .insert(supportMessages)
      .values({
        threadId: thread.id,
        senderType: "SUPERADMIN",
        senderUserId: admin.id,
        senderName: admin.username,
        senderEmail: admin.email ?? null,
        via: "APP",
        body,
      })
      .returning();

    await db
      .update(supportThreads)
      .set({
        status: "OPEN",
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportThreads.id, thread.id));

    const requesterUserId = await this.resolveRequesterUserId(thread);
    if (requesterUserId) {
      await NotificationsService.createForUser({
        userId: requesterUserId,
        type: "SUPPORT_REPLY",
        title: "New support reply",
        body: body.slice(0, 140),
        metadata: { threadId: thread.id, messageId: message.id },
        push: true,
      });
    }

    this.emitThreadChanged(thread.id, requesterUserId);

    return message;
  }

  static async listUserThreads(userId: string) {
    const threads = await db.query.supportThreads.findMany({
      where: and(eq(supportThreads.requesterUserId, userId), eq(supportThreads.source, "USER_DASHBOARD")),
      orderBy: [desc(supportThreads.lastMessageAt)],
    });

    return Promise.all(
      threads.map(async (thread) => {
        const latest = await db.query.supportMessages.findFirst({
          where: and(eq(supportMessages.threadId, thread.id), ne(supportMessages.senderType, "SYSTEM")),
          orderBy: [desc(supportMessages.createdAt)],
        });
        const first = await db.query.supportMessages.findFirst({
          where: and(eq(supportMessages.threadId, thread.id), ne(supportMessages.senderType, "SYSTEM")),
          orderBy: [asc(supportMessages.createdAt)],
        });

        return {
          ...thread,
          latestMessagePreview: latest?.body.slice(0, 140) ?? "",
          ticketSubject: first?.body.split("\n")[0]?.slice(0, 140) ?? "",
          latestSenderType: latest?.senderType ?? null,
          latestMessageAt: latest?.createdAt ?? null,
        };
      }),
    );
  }

  static async getUserThreadMessages(userId: string, threadId: string) {
    const thread = await db.query.supportThreads.findFirst({
      where: and(eq(supportThreads.id, threadId), eq(supportThreads.requesterUserId, userId), eq(supportThreads.source, "USER_DASHBOARD")),
    });
    if (!thread) return null;

    const messages = await db.query.supportMessages.findMany({
      where: and(eq(supportMessages.threadId, threadId), ne(supportMessages.senderType, "SYSTEM")),
      orderBy: [supportMessages.createdAt],
    });

    return { thread, messages };
  }

  static async replyAsUser(input: UserReplyInput) {
    const thread = await db.query.supportThreads.findFirst({
      where: and(eq(supportThreads.id, input.threadId), eq(supportThreads.requesterUserId, input.userId), eq(supportThreads.source, "USER_DASHBOARD")),
    });
    if (!thread) return null;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, input.userId),
      columns: { id: true, username: true, email: true },
    });
    if (!currentUser) return null;

    const body = input.body.trim();
    if (!body) return null;

    const [message] = await db
      .insert(supportMessages)
      .values({
        threadId: thread.id,
        senderType: "USER",
        senderUserId: currentUser.id,
        senderName: currentUser.username,
        senderEmail: currentUser.email ?? thread.requesterEmail,
        via: "APP",
        body,
      })
      .returning();

    await db
      .update(supportThreads)
      .set({
        status: "OPEN",
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportThreads.id, thread.id));

    await NotificationsService.createForRoles({
      roles: ["SUPERADMIN"],
      type: "SUPPORT_REPLY",
      title: "New user reply",
      body: `${currentUser.username} replied to a support ticket.`,
      metadata: { threadId: thread.id, messageId: message.id },
      push: true,
    });

    this.emitThreadChanged(thread.id, thread.requesterUserId);

    return message;
  }

  static async closeThread(input: CloseThreadInput): Promise<CloseThreadResult> {
    const thread = await db.query.supportThreads.findFirst({
      where: eq(supportThreads.id, input.threadId),
    });
    if (!thread) return { ok: false, reason: "NOT_FOUND" };

    const admin = await db.query.users.findFirst({
      where: eq(users.id, input.closedByUserId),
      columns: { id: true, username: true, email: true },
    });
    if (!admin) return { ok: false, reason: "NOT_FOUND" };

    const requesterUserId = await this.resolveRequesterUserId(thread);

    if (thread.status === "CLOSED") {
      const firstCloseEvent = await db.query.supportMessages.findFirst({
        where: and(
          eq(supportMessages.threadId, thread.id),
          eq(supportMessages.senderType, "SYSTEM"),
          eq(supportMessages.body, "Ticket closed by support."),
        ),
        orderBy: [asc(supportMessages.createdAt)],
      });

      if (!firstCloseEvent) return { ok: false, reason: "REOPEN_WINDOW_EXPIRED" };

      const now = Date.now();
      const firstCloseAt = new Date(firstCloseEvent.createdAt).getTime();
      const windowMs = 30 * 24 * 60 * 60 * 1000;
      if (now - firstCloseAt > windowMs) {
        return { ok: false, reason: "REOPEN_WINDOW_EXPIRED" };
      }

      await db.insert(supportMessages).values({
        threadId: thread.id,
        senderType: "SYSTEM",
        senderUserId: input.closedByUserId,
        senderName: "Support Admin",
        senderEmail: null,
        via: "APP",
        body: "Ticket reopened by support.",
      });

      await db
        .update(supportThreads)
        .set({
          status: "OPEN",
          updatedAt: new Date(),
        })
        .where(eq(supportThreads.id, thread.id));

      if (thread.source === "PUBLIC") {
        await sendPublicTicketStatusEmail(thread.requesterEmail, thread.requesterName, thread.id, "OPEN");
      }

      if (requesterUserId) {
        await NotificationsService.createForUser({
          userId: requesterUserId,
          type: "SUPPORT_STATUS",
          title: "Ticket reopened",
          body: "Support reopened your ticket.",
          metadata: { threadId: thread.id, status: "OPEN" },
          push: true,
        });
      }
      this.emitThreadChanged(thread.id, requesterUserId);

      return { ok: true, action: "reopened" };
    }

    await db.insert(supportMessages).values({
      threadId: thread.id,
      senderType: "SYSTEM",
      senderUserId: input.closedByUserId,
      senderName: "Support Admin",
      senderEmail: null,
      via: "APP",
      body: "Ticket closed by support.",
    });

    await db
      .update(supportThreads)
      .set({
        status: "CLOSED",
        updatedAt: new Date(),
      })
      .where(eq(supportThreads.id, thread.id));

    if (thread.source === "PUBLIC") {
      await sendPublicTicketStatusEmail(thread.requesterEmail, thread.requesterName, thread.id, "CLOSED");
    }

    if (requesterUserId) {
      await NotificationsService.createForUser({
        userId: requesterUserId,
        type: "SUPPORT_STATUS",
        title: "Ticket closed",
        body: "Support closed your ticket.",
        metadata: { threadId: thread.id, status: "CLOSED" },
        push: true,
      });
    }
    this.emitThreadChanged(thread.id, requesterUserId);

    return { ok: true, action: "closed" };
  }

  static async receiveInboundReply(fromEmail: string, subject: string, body: string) {
    const email = fromEmail.trim().toLowerCase();
    const ticketMatch = subject.match(/TICKET:([0-9a-f-]{36})/i);
    if (!ticketMatch?.[1]) return null;
    const threadId = ticketMatch[1];

    const thread = await db.query.supportThreads.findFirst({
      where: and(eq(supportThreads.id, threadId), eq(supportThreads.requesterEmail, email)),
    });
    if (!thread) return null;

    const wasClosed = thread.status === "CLOSED";

    const [message] = await db
      .insert(supportMessages)
      .values({
        threadId,
        senderType: "USER",
        senderUserId: thread.requesterUserId ?? null,
        senderName: thread.requesterName,
        senderEmail: email,
        via: "EMAIL",
        body: body.trim(),
      })
      .returning();

    await db
      .update(supportThreads)
      .set({
        status: "OPEN",
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportThreads.id, threadId));

    if (thread.source === "PUBLIC" && wasClosed) {
      await sendPublicTicketStatusEmail(thread.requesterEmail, thread.requesterName, thread.id, "OPEN");
    }

    await NotificationsService.createForRoles({
      roles: ["SUPERADMIN"],
      type: "SUPPORT_REPLY",
      title: "New email reply",
      body: `${thread.requesterName} replied by email.`,
      metadata: { threadId: thread.id, messageId: message.id },
      push: true,
    });

    this.emitThreadChanged(thread.id, thread.requesterUserId);

    return message;
  }

  static async deleteClosedThreadAsAdmin(threadId: string) {
    const thread = await db.query.supportThreads.findFirst({
      where: eq(supportThreads.id, threadId),
      columns: { id: true, status: true, requesterUserId: true, requesterEmail: true, source: true },
    });
    if (!thread) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (thread.status !== "CLOSED") return { ok: false as const, reason: "NOT_CLOSED" as const };

    await db.delete(supportMessages).where(eq(supportMessages.threadId, thread.id));
    await db.delete(supportThreads).where(eq(supportThreads.id, thread.id));

    const requesterUserId = await this.resolveRequesterUserId(thread);
    if (requesterUserId) {
      await NotificationsService.createForUser({
        userId: requesterUserId,
        type: "SUPPORT_TICKET_DELETED",
        title: "Ticket deleted",
        body: "Support deleted your ticket.",
        metadata: { threadId: thread.id, status: "DELETED" },
        push: true,
      });
      emitToUser(requesterUserId, "support:thread-deleted", { threadId: thread.id });
    }

    emitToRole("SUPERADMIN", "support:thread-deleted", { threadId: thread.id });
    return { ok: true as const };
  }
}
