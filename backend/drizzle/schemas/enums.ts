import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["SUPERADMIN", "SCHOOLADMIN", "INSTRUCTOR", "STUDENT"]);
export const weekDaysEnum = pgEnum("week_days", ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);