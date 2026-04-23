import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { instructorProfiles, studentProfiles } from "./profiles.js";

export const workSchedules = pgTable("work_schedules", {
    id: uuid("id").primaryKey().defaultRandom(),
    schedule: jsonb("schedule").notNull(),
    instructorId: uuid("instructor_id").notNull().unique().references(() => instructorProfiles.id),
});

export const scheduleCycles = pgTable("schedule_cycles", {
    id: uuid("id").primaryKey().defaultRandom(),
    instructorId: uuid("instructor_id").notNull().references(() => instructorProfiles.id),
    weekStartDate: timestamp("week_start_date").notNull(),
    status: text("status").notNull().default("DRAFT"),
    scheduleSnapshot: jsonb("schedule_snapshot").notNull(),
    sentAt: timestamp("sent_at"),
    allocationStartedAt: timestamp("allocation_started_at"),
    allocationCompletedAt: timestamp("allocation_completed_at"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    uniqueIndex("schedule_cycles_instructor_week_uq").on(table.instructorId, table.weekStartDate),
]);

export const timeSlots = pgTable("time_slots", {
    id: uuid("id").primaryKey().defaultRandom(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    isDone: boolean("is_done").default(false).notNull(),
    scheduleCycleId: uuid("schedule_cycle_id").references(() => scheduleCycles.id, { onDelete: "set null" }),
    instructorId: uuid("instructor_id").notNull().references(() => instructorProfiles.id),
    studentId: uuid("student_id").references(() => studentProfiles.id),
    dayKey: text("day_key"),
    slotKey: text("slot_key"),
});

export const lessonSessions = pgTable("lesson_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    timeSlotId: uuid("time_slot_id").notNull().unique().references(() => timeSlots.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("PLANNED"),
    startCodeHash: text("start_code_hash"),
    startCodeIssuedAt: timestamp("start_code_issued_at"),
    startCodeExpiresAt: timestamp("start_code_expires_at"),
    startedAt: timestamp("started_at"),
    startedByStudentAt: timestamp("started_by_student_at"),
    endRequestedAt: timestamp("end_requested_at"),
    endedByStudentAt: timestamp("ended_by_student_at"),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentScheduleReplies = pgTable("student_schedule_replies", {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id").notNull().references(() => scheduleCycles.id, { onDelete: "cascade" }),
    studentProfileId: uuid("student_profile_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
    unavailableSlotKeys: jsonb("unavailable_slot_keys").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    uniqueIndex("student_schedule_replies_cycle_student_uq").on(table.cycleId, table.studentProfileId),
]);

export const studentLessons = pgTable("student_lessons", {
    id: uuid("id").primaryKey().defaultRandom(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    notes: text("notes"),
    rating: integer("rating"),
    studentProfileId: uuid("student_profile_id").notNull().references(() => studentProfiles.id),
});

export const instructorBlockouts = pgTable("instructor_blockouts", {
    id: uuid("id").primaryKey().defaultRandom(),
    blockouts: jsonb("blockouts").notNull(),
    instructorId: uuid("instructor_id")
        .notNull()
        .unique()
        .references(() => instructorProfiles.id),
});

export const studentBlockouts = pgTable("student_blockouts", {
    id: uuid("id").primaryKey().defaultRandom(),
    blockouts: jsonb("blockouts").notNull(),
    studentId: uuid("student_id")
        .notNull()
        .unique()
        .references(() => studentProfiles.id),
});
