import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const supportThreads = pgTable("support_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull().default("PUBLIC"), // PUBLIC | USER_DASHBOARD | EMAIL
  subject: text("subject"),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email").notNull(),
  requesterUserId: uuid("requester_user_id").references(() => users.id),
  status: text("status").notNull().default("OPEN"), // OPEN | WAITING_USER | CLOSED
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => supportThreads.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(), // USER | SUPERADMIN | SYSTEM
  senderUserId: uuid("sender_user_id").references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email"),
  via: text("via").notNull().default("APP"), // APP | EMAIL | WEB
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
