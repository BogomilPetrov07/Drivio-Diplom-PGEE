import { sql, relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums.js";
import { schools } from "./school.js";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    password: text("password").notNull(),
    name: text("name"),
    role: roleEnum("role").notNull(),
    drivingSchoolId: uuid("driving_school_id").references(() => schools.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceName: text("device_name").notNull(),
    ip: text("ip").notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").default(sql`NOW() + interval '30 days'`).notNull(),
    lastActivity: timestamp("last_activity").defaultNow().notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    signature: text("signature"),
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

export const refreshTokens = pgTable("refresh_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").default(sql`NOW() + interval '7 days'`).notNull(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: 'cascade' }),
    signature: text("signature"),
    replaceTokenId: text("replace_token_id"),
    replacedAt: timestamp("replaced_at"),
}, (table) => [index("tokens_session_id_idx").on(table.sessionId)]);

export const userProfileSetupTokens = pgTable("user_profile_setup_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    maxUses: integer("max_uses").notNull().default(5),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [index("user_profile_setup_tokens_user_id_idx").on(table.userId)]);

// --- RELATIONS DEFINITIONS ---

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    profileSetupTokens: many(userProfileSetupTokens),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
    refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    session: one(sessions, {
        fields: [refreshTokens.sessionId],
        references: [sessions.id],
    }),
}));

export const userProfileSetupTokensRelations = relations(userProfileSetupTokens, ({ one }) => ({
    user: one(users, {
        fields: [userProfileSetupTokens.userId],
        references: [users.id],
    }),
}));
