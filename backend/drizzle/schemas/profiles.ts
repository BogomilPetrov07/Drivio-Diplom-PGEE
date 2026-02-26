import { pgTable, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const studentProfiles = pgTable("student_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique().references(() => users.id),
    completedHours: integer("completed_hours").default(0).notNull(),
    instructorId: uuid("instructor_id").notNull().references(() => instructorProfiles.id),
});

export const instructorProfiles = pgTable("instructor_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique().references(() => users.id),
});