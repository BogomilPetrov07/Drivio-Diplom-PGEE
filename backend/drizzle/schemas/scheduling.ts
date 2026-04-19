import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { instructorProfiles, studentProfiles } from "./profiles.js";

export const workSchedules = pgTable("work_schedules", {
    id: uuid("id").primaryKey().defaultRandom(),
    schedule: jsonb("schedule").notNull(),
    instructorId: uuid("instructor_id").notNull().unique().references(() => instructorProfiles.id),
});

export const timeSlots = pgTable("time_slots", {
    id: uuid("id").primaryKey().defaultRandom(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    isDone: boolean("is_done").default(false).notNull(),
    instructorId: uuid("instructor_id").notNull().references(() => instructorProfiles.id),
    studentId: uuid("student_id").references(() => studentProfiles.id),
});

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
