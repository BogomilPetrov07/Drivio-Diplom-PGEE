import { and, asc, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../../config/drizzle.js";
import {
  cars,
  instructorProfiles,
  lessonSessions,
  roleEnum,
  scheduleCycles,
  schools,
  studentLessons,
  studentProfiles,
  studentScheduleReplies,
  timeSlots,
  users,
  workSchedules,
} from "../../../drizzle/schemas/index.js";
import { OnboardingService } from "../onboarding/onboarding.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { emitToUser } from "../../realtime/socket.js";
import { sendUserProfileSetupEmail } from "../../utils/email.js";
import { getPreferredFrontendUrl } from "../../utils/frontend-url.js";
import { hash } from "../../utils/password.js";
import type {
  InstructorScheduleDayKey,
  InstructorScheduleDays,
  InstructorSchedulePayload,
  InstructorStudentListItem,
  LessonSessionState,
  ScheduleBlueprintSlot,
  ScheduleCycleStatus,
  ScheduleSlotBlueprint,
  SchoolPersonInput,
  SchoolPersonListItem,
  SchoolCarInput,
  SchoolRole,
  SendInstructorSchedulePayload,
  StudentInstructorSummary,
  StudentProgressSummary,
  StudentAvailabilityPayload,
} from "./dashboard.types.js";

const DAY_KEYS: InstructorScheduleDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const MAX_INSTRUCTOR_STUDENTS = 12;
const REQUIRED_HOURS = 31;
const LESSON_START_CODE_TTL_MINUTES = 10;
const LESSON_SESSION_ACTIVE_STATES: LessonSessionState[] = ["ACTIVE", "FAILED", "COMPLETED"];

export class DashboardService {
  private static async autoCompleteElapsedLessons(
    slots: Array<{
      id: string;
      instructorId: string;
      studentId: string | null;
      startTime: Date;
      endTime: Date;
      isDone: boolean;
    }>,
  ) {
    const now = new Date();
    const overdueSlots = slots.filter((slot) => !slot.isDone && slot.endTime.getTime() <= now.getTime());
    if (overdueSlots.length === 0) return false;

    const overdueSlotIds = overdueSlots.map((slot) => slot.id);
    const sessions = await db.query.lessonSessions.findMany({
      where: inArray(lessonSessions.timeSlotId, overdueSlotIds),
      columns: { timeSlotId: true, state: true },
    });
    const completableSessionSlotIds = sessions
      .filter((session) => session.state === "ACTIVE" || session.state === "END_REQUESTED")
      .map((session) => session.timeSlotId);

    if (completableSessionSlotIds.length === 0) return false;

    const slotById = new Map(overdueSlots.map((slot) => [slot.id, slot] as const));

    await db.transaction(async (tx) => {
      await tx
        .update(lessonSessions)
        .set({
          state: "COMPLETED",
          endedAt: now,
          updatedAt: now,
        })
        .where(inArray(lessonSessions.timeSlotId, completableSessionSlotIds));

      await tx
        .update(timeSlots)
        .set({ isDone: true })
        .where(inArray(timeSlots.id, completableSessionSlotIds));

      for (const slotId of completableSessionSlotIds) {
        const slot = slotById.get(slotId);
        if (!slot?.studentId) continue;

        const existingLesson = await tx.query.studentLessons.findFirst({
          where: and(
            eq(studentLessons.studentProfileId, slot.studentId),
            eq(studentLessons.startTime, slot.startTime),
            eq(studentLessons.endTime, slot.endTime),
          ),
          columns: { id: true },
        });

        if (!existingLesson) {
          await tx
            .insert(studentLessons)
            .values({
              studentProfileId: slot.studentId,
              startTime: slot.startTime,
              endTime: slot.endTime,
              completedAt: now,
            });
        }
      }
    });

    const affectedInstructorIds = Array.from(new Set(
      completableSessionSlotIds
        .map((slotId) => slotById.get(slotId)?.instructorId)
        .filter((instructorId): instructorId is string => Boolean(instructorId)),
    ));

    await Promise.all(
      affectedInstructorIds.map((instructorId) =>
        this.emitScheduleChanged(instructorId, { kind: "LESSON_STATE_UPDATED" }),
      ),
    );

    return true;
  }

  private static sanitizeUsernameBase(value: string) {
    const base = value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-._]+|[-._]+$/g, "");

    return base || "user";
  }

  private static async generateUniqueUsername(email: string) {
    const emailBase = email.includes("@") ? email.slice(0, email.indexOf("@")) : email;
    const normalizedBase = this.sanitizeUsernameBase(emailBase);
    let candidate = normalizedBase;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, candidate),
        columns: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      const suffix = crypto.randomBytes(2).toString("hex");
      candidate = `${normalizedBase}-${suffix}`;
    }

    return `${normalizedBase}-${Date.now().toString(36)}`;
  }

  private static generateTemporaryPassword() {
    return crypto.randomBytes(24).toString("base64url");
  }

  private static getDefaultInstructorScheduleDays(): InstructorScheduleDays {
    return {
      monday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      tuesday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      wednesday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      thursday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      friday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      saturday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
      sunday: { enabled: false, startTime: "09:00", endTime: "17:00", blockedLessonKeys: [] },
    };
  }

  private static isClock(value: string) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private static normalizeInstructorScheduleDays(input: unknown): InstructorScheduleDays {
    const normalized = this.getDefaultInstructorScheduleDays();
    if (!input || typeof input !== "object") return normalized;

    const inputRecord = input as Record<string, unknown>;

    for (const dayKey of DAY_KEYS) {
      const dayValue = inputRecord[dayKey];
      if (!dayValue || typeof dayValue !== "object") {
        continue;
      }

      const dayRecord = dayValue as Record<string, unknown>;
      normalized[dayKey] = {
        enabled: Boolean(dayRecord.enabled),
        startTime: typeof dayRecord.startTime === "string" && this.isClock(dayRecord.startTime)
          ? dayRecord.startTime
          : "09:00",
        endTime: typeof dayRecord.endTime === "string" && this.isClock(dayRecord.endTime)
          ? dayRecord.endTime
          : "17:00",
        blockedLessonKeys: Array.isArray(dayRecord.blockedLessonKeys)
          ? dayRecord.blockedLessonKeys.filter((item): item is string => typeof item === "string")
          : [],
      };
    }

    return normalized;
  }

  private static getWeekStartDate(input?: string | Date) {
    const date = input instanceof Date ? new Date(input) : input ? new Date(input) : new Date();
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
    return date;
  }

  private static getWeekEndDate(weekStartDate: Date) {
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 7);
    return end;
  }

  private static getDayIndex(dayKey: InstructorScheduleDayKey) {
    return DAY_KEYS.indexOf(dayKey);
  }

  private static parseClockToMinutes(value: string) {
    if (!this.isClock(value)) return null;
    const [hoursRaw, minutesRaw] = value.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  }

  private static parseClockParts(value: string) {
    if (!this.isClock(value)) return null;
    const [hoursRaw, minutesRaw] = value.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return { hours, minutes };
  }

  private static toSlotDateTime(weekStartDate: Date, dayKey: InstructorScheduleDayKey, clock: string) {
    const parts = this.parseClockParts(clock);
    if (!parts) return null;
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + this.getDayIndex(dayKey));
    date.setHours(parts.hours, parts.minutes, 0, 0);
    return date;
  }

  private static toSlotKey(startTime: string, endTime: string) {
    return `${startTime}-${endTime}`;
  }

  private static normalizeBlueprintSlot(input: unknown): ScheduleBlueprintSlot | null {
    if (!input || typeof input !== "object") return null;
    const row = input as Record<string, unknown>;
    const startTime = typeof row.startTime === "string" ? row.startTime : "";
    const endTime = typeof row.endTime === "string" ? row.endTime : "";
    const key = typeof row.key === "string" ? row.key : this.toSlotKey(startTime, endTime);
    if (!this.isClock(startTime) || !this.isClock(endTime) || endTime <= startTime) return null;
    if (key !== this.toSlotKey(startTime, endTime)) return null;
    return { key, startTime, endTime };
  }

  private static buildFallbackSlotBlueprint(days: InstructorScheduleDays): ScheduleSlotBlueprint {
    const blueprint = DAY_KEYS.reduce((acc, dayKey) => {
      acc[dayKey] = [];
      return acc;
    }, {} as ScheduleSlotBlueprint);

    for (const dayKey of DAY_KEYS) {
      const day = days[dayKey];
      if (!day.enabled) continue;
      const start = this.parseClockToMinutes(day.startTime);
      const end = this.parseClockToMinutes(day.endTime);
      if (start === null || end === null || end <= start) continue;
      const blocked = new Set(day.blockedLessonKeys);

      let cursor = start;
      while (cursor + 60 <= end) {
        const slotStartHours = Math.floor(cursor / 60).toString().padStart(2, "0");
        const slotStartMinutes = (cursor % 60).toString().padStart(2, "0");
        const slotEndTotal = cursor + 60;
        const slotEndHours = Math.floor(slotEndTotal / 60).toString().padStart(2, "0");
        const slotEndMinutes = (slotEndTotal % 60).toString().padStart(2, "0");
        const slotStart = `${slotStartHours}:${slotStartMinutes}`;
        const slotEnd = `${slotEndHours}:${slotEndMinutes}`;
        const slotKey = this.toSlotKey(slotStart, slotEnd);
        if (!blocked.has(slotKey)) {
          blueprint[dayKey].push({ key: slotKey, startTime: slotStart, endTime: slotEnd });
        }
        cursor += 60;
      }
    }

    return blueprint;
  }

  private static normalizeScheduleSlotBlueprint(input: unknown, days: InstructorScheduleDays): ScheduleSlotBlueprint {
    const fallback = this.buildFallbackSlotBlueprint(days);
    if (!input || typeof input !== "object") return fallback;

    const record = input as Record<string, unknown>;
    const normalized = DAY_KEYS.reduce((acc, dayKey) => {
      const day = days[dayKey];
      if (!day.enabled) {
        acc[dayKey] = [];
        return acc;
      }

      const slotsRaw = Array.isArray(record[dayKey]) ? record[dayKey] : null;
      if (!slotsRaw) {
        acc[dayKey] = fallback[dayKey];
        return acc;
      }

      const rows = slotsRaw
        .map((slot) => this.normalizeBlueprintSlot(slot))
        .filter((slot): slot is ScheduleBlueprintSlot => Boolean(slot));

      if (rows.length === 0) {
        acc[dayKey] = fallback[dayKey];
        return acc;
      }

      const dedup = new Map<string, ScheduleBlueprintSlot>();
      for (const row of rows) {
        dedup.set(row.key, row);
      }

      acc[dayKey] = Array.from(dedup.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as ScheduleSlotBlueprint);

    return normalized;
  }

  private static parseCycleSnapshot(input: unknown) {
    const payload = input as Record<string, unknown> | null;
    const days = this.normalizeInstructorScheduleDays(payload?.days);
    const slotBlueprint = this.normalizeScheduleSlotBlueprint(payload?.slotBlueprint, days);
    return { days, slotBlueprint };
  }

  private static normalizeUnavailableSlotKeys(input: unknown) {
    const empty = DAY_KEYS.reduce((acc, dayKey) => {
      acc[dayKey] = [];
      return acc;
    }, {} as Record<InstructorScheduleDayKey, string[]>);
    if (!input || typeof input !== "object") return empty;

    const record = input as Record<string, unknown>;
    for (const dayKey of DAY_KEYS) {
      const daySlots = record[dayKey];
      if (!Array.isArray(daySlots)) continue;
      empty[dayKey] = Array.from(new Set(daySlots.filter((item): item is string => typeof item === "string")));
    }
    return empty;
  }

  private static hashLessonCode(code: string) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  private static async getStudentProfileContext(userId: string) {
    const profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, userId),
      columns: { id: true, instructorId: true, completedHours: true },
    });

    if (!profile) return null;
    return {
      studentProfileId: profile.id,
      instructorProfileId: profile.instructorId,
      completedHours: profile.completedHours,
    };
  }

  private static async listInstructorStudentProfiles(instructorProfileId: string) {
    const rows = await db.query.studentProfiles.findMany({
      where: eq(studentProfiles.instructorId, instructorProfileId),
      columns: { id: true, userId: true, completedHours: true },
      orderBy: [asc(studentProfiles.id)],
    });

    return rows.slice(0, MAX_INSTRUCTOR_STUDENTS);
  }

  private static async getInstructorProfileContext(userId: string) {
    const profile = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.userId, userId),
      columns: { id: true, userId: true },
    });
    return profile ? { instructorProfileId: profile.id, instructorUserId: profile.userId } : null;
  }

  private static async emitScheduleChanged(
    instructorProfileId: string,
    payload: {
      kind:
      | "WORK_SCHEDULE_UPDATED"
      | "SCHEDULE_CYCLE_UPDATED"
      | "STUDENT_AVAILABILITY_UPDATED"
      | "LESSON_STATE_UPDATED";
      weekStartDate?: string;
      cycleId?: string;
      timeSlotId?: string;
    },
  ) {
    const instructor = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.id, instructorProfileId),
      columns: { userId: true },
    });

    if (instructor?.userId) {
      emitToUser(instructor.userId, "schedule:changed", payload);
    }

    const students = await this.listInstructorStudentProfiles(instructorProfileId);
    for (const student of students) {
      emitToUser(student.userId, "schedule:changed", payload);
    }
  }

  private static async getSchoolAdminContext(userId: string) {
    const actor = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.role, "SCHOOLADMIN")),
      columns: { id: true, drivingSchoolId: true },
    });

    if (!actor?.drivingSchoolId) {
      return null;
    }

    return { schoolId: actor.drivingSchoolId };
  }

  static async getSchoolDetails(actorUserId: string) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return null;

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, context.schoolId),
      columns: {
        id: true,
        name: true,
        region: true,
        city: true,
        address: true,
        phone: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!school) return null;

    return {
      ...school,
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString(),
    };
  }

  static async updateSchoolDetails(actorUserId: string, input: { name: string; region: string; city: string; address: string; phone: string; rating?: number }) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const name = input.name.trim();
    const region = input.region.trim();
    const city = input.city.trim();
    const address = input.address.trim();
    const phone = input.phone.trim();
    const rating = typeof input.rating === "number" ? Math.max(1, Math.min(5, Math.round(input.rating))) : 5;

    if (!name || !region || !city || !address || !phone) {
      return { status: "VALIDATION_ERROR" as const };
    }

    const sameNameSchool = await db.query.schools.findFirst({
      where: and(eq(schools.name, name), ne(schools.id, context.schoolId)),
      columns: { id: true },
    });

    if (sameNameSchool) {
      return { status: "NAME_TAKEN" as const };
    }

    const [updated] = await db
      .update(schools)
      .set({
        name,
        region,
        city,
        address,
        phone,
        rating,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, context.schoolId))
      .returning();

    return {
      status: "SUCCESS" as const,
      school: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  static async listSchoolCars(actorUserId: string) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return null;

    const rows = await db.query.cars.findMany({
      where: eq(cars.schoolId, context.schoolId),
      columns: {
        id: true,
        licensePlate: true,
        isAvailable: true,
        ptiExpireDate: true,
        vignetteExpireDate: true,
      },
      orderBy: [asc(cars.licensePlate)],
    });

    return rows.map((row) => ({
      id: row.id,
      licensePlate: row.licensePlate,
      isAvailable: row.isAvailable,
      ptiExpireDate: row.ptiExpireDate.toISOString(),
      vignetteExpireDate: row.vignetteExpireDate.toISOString(),
    }));
  }

  static async createSchoolCar(actorUserId: string, input: SchoolCarInput) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const licensePlate = input.licensePlate.trim().toUpperCase();
    const ptiExpireDate = new Date(input.ptiExpireDate);
    const vignetteExpireDate = new Date(input.vignetteExpireDate);

    if (!licensePlate || Number.isNaN(ptiExpireDate.getTime()) || Number.isNaN(vignetteExpireDate.getTime())) {
      return { status: "VALIDATION_ERROR" as const };
    }

    const [created] = await db.insert(cars).values({
      licensePlate,
      isAvailable: Boolean(input.isAvailable),
      ptiExpireDate,
      vignetteExpireDate,
      schoolId: context.schoolId,
    }).returning();

    return {
      status: "SUCCESS" as const,
      car: {
        id: created.id,
        licensePlate: created.licensePlate,
        isAvailable: created.isAvailable,
        ptiExpireDate: created.ptiExpireDate.toISOString(),
        vignetteExpireDate: created.vignetteExpireDate.toISOString(),
      },
    };
  }

  static async updateSchoolCar(actorUserId: string, carId: string, input: SchoolCarInput) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const existing = await db.query.cars.findFirst({
      where: and(eq(cars.id, carId), eq(cars.schoolId, context.schoolId)),
      columns: { id: true },
    });
    if (!existing) return { status: "CAR_NOT_FOUND" as const };

    const licensePlate = input.licensePlate.trim().toUpperCase();
    const ptiExpireDate = new Date(input.ptiExpireDate);
    const vignetteExpireDate = new Date(input.vignetteExpireDate);

    if (!licensePlate || Number.isNaN(ptiExpireDate.getTime()) || Number.isNaN(vignetteExpireDate.getTime())) {
      return { status: "VALIDATION_ERROR" as const };
    }

    const [updated] = await db.update(cars).set({
      licensePlate,
      isAvailable: Boolean(input.isAvailable),
      ptiExpireDate,
      vignetteExpireDate,
    }).where(eq(cars.id, carId)).returning();

    return {
      status: "SUCCESS" as const,
      car: {
        id: updated.id,
        licensePlate: updated.licensePlate,
        isAvailable: updated.isAvailable,
        ptiExpireDate: updated.ptiExpireDate.toISOString(),
        vignetteExpireDate: updated.vignetteExpireDate.toISOString(),
      },
    };
  }

  static async deleteSchoolCar(actorUserId: string, carId: string) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const existing = await db.query.cars.findFirst({
      where: and(eq(cars.id, carId), eq(cars.schoolId, context.schoolId)),
      columns: { id: true },
    });
    if (!existing) return { status: "CAR_NOT_FOUND" as const };

    await db.delete(cars).where(eq(cars.id, carId));
    return { status: "SUCCESS" as const };
  }

  static async listSchoolPeople(actorUserId: string) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return null;

    const schoolUsers = await db.query.users.findMany({
      where: eq(users.drivingSchoolId, context.schoolId),
      columns: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const userIds = schoolUsers.map((item) => item.id);
    if (userIds.length === 0) return [];

    const instructorRows = await db.query.instructorProfiles.findMany({
      where: inArray(instructorProfiles.userId, userIds),
      columns: { userId: true, id: true },
    });

    const instructorByUserId = new Map(instructorRows.map((row) => [row.userId, row.id] as const));

    const studentRows = await db.query.studentProfiles.findMany({
      where: inArray(studentProfiles.userId, userIds),
      columns: { userId: true, instructorId: true },
    });

    const instructorUserByProfileId = new Map(
      instructorRows.map((row) => [row.id, row.userId] as const),
    );

    const studentInstructorByUserId = new Map<string, string | null>();
    for (const student of studentRows) {
      studentInstructorByUserId.set(student.userId, instructorUserByProfileId.get(student.instructorId) ?? null);
    }

    const result: SchoolPersonListItem[] = schoolUsers.map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      name: item.name,
      role: item.role as SchoolRole,
      createdAt: item.createdAt.toISOString(),
      hasInstructorProfile: instructorByUserId.has(item.id),
      studentInstructorUserId: studentInstructorByUserId.get(item.id) ?? null,
    }));

    return result;
  }

  static async createSchoolPerson(actorUserId: string, input: SchoolPersonInput) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name || !email) {
      return { status: "VALIDATION_ERROR" as const };
    }

    if (!["SCHOOLADMIN", "INSTRUCTOR", "STUDENT"].includes(input.role)) {
      return { status: "INVALID_ROLE" as const };
    }

    const existingByEmail = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
    if (existingByEmail) return { status: "EMAIL_TAKEN" as const };

    const username = await this.generateUniqueUsername(email);
    const passwordHash = await hash(this.generateTemporaryPassword());

    const created = await db.transaction(async (tx) => {
      let studentInstructorProfileId: string | null = null;

      if (input.role === "STUDENT") {
        if (!input.instructorUserId) {
          throw new Error("MISSING_INSTRUCTOR");
        }

        const instructor = await tx.query.users.findFirst({
          where: and(
            eq(users.id, input.instructorUserId),
            eq(users.drivingSchoolId, context.schoolId),
            eq(users.role, "INSTRUCTOR"),
          ),
          columns: { id: true },
        });

        if (!instructor) {
          throw new Error("INVALID_INSTRUCTOR");
        }

        const instructorProfile = await tx.query.instructorProfiles.findFirst({
          where: eq(instructorProfiles.userId, instructor.id),
          columns: { id: true },
        });

        if (!instructorProfile) {
          throw new Error("INVALID_INSTRUCTOR");
        }

        studentInstructorProfileId = instructorProfile.id;
      }

      const [newUser] = await tx
        .insert(users)
        .values({
          username,
          email,
          password: passwordHash,
          name,
          role: input.role,
          drivingSchoolId: context.schoolId,
        })
        .returning();

      if (input.role === "INSTRUCTOR" || (input.role === "SCHOOLADMIN" && input.hasInstructorPrivileges)) {
        await tx.insert(instructorProfiles).values({ userId: newUser.id });
      }

      if (input.role === "STUDENT" && studentInstructorProfileId) {
        await tx.insert(studentProfiles).values({
          userId: newUser.id,
          instructorId: studentInstructorProfileId,
          completedHours: 0,
        });
      }

      return newUser;
    }).catch((error: Error) => {
      if (error.message === "MISSING_INSTRUCTOR") return { error: "MISSING_INSTRUCTOR" as const };
      if (error.message === "INVALID_INSTRUCTOR") return { error: "INVALID_INSTRUCTOR" as const };
      throw error;
    });

    if ("error" in created) {
      if (created.error === "MISSING_INSTRUCTOR") return { status: "MISSING_INSTRUCTOR" as const };
      return { status: "INVALID_INSTRUCTOR" as const };
    }

    const setupToken = await OnboardingService.createUserProfileSetupToken({
      userId: created.id,
      email,
    });
    const setupUrl = `${getPreferredFrontendUrl()}/register/user/complete?token=${setupToken.rawToken}`;
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, context.schoolId),
      columns: { name: true },
    });

    await sendUserProfileSetupEmail(
      email,
      name,
      school?.name ?? "your driving school",
      setupUrl,
    );

    return { status: "SUCCESS" as const, userId: created.id };
  }

  static async updateSchoolPerson(actorUserId: string, targetUserId: string, input: SchoolPersonInput) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const target = await db.query.users.findFirst({
      where: and(eq(users.id, targetUserId), eq(users.drivingSchoolId, context.schoolId)),
      columns: { id: true, role: true },
    });

    if (!target) return { status: "USER_NOT_FOUND" as const };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name || !email) {
      return { status: "VALIDATION_ERROR" as const };
    }

    const existingByEmail = await db.query.users.findFirst({
      where: and(eq(users.email, email), ne(users.id, targetUserId)),
      columns: { id: true },
    });
    if (existingByEmail) return { status: "EMAIL_TAKEN" as const };

    const nextRole = input.role;
    if (!["SCHOOLADMIN", "INSTRUCTOR", "STUDENT"].includes(nextRole)) {
      return { status: "INVALID_ROLE" as const };
    }

    if (actorUserId === targetUserId && nextRole !== "SCHOOLADMIN") {
      return { status: "SELF_ROLE_DOWNGRADE_FORBIDDEN" as const };
    }

    const updated = await db.transaction(async (tx) => {
      if (nextRole === "STUDENT") {
        if (!input.instructorUserId) {
          throw new Error("MISSING_INSTRUCTOR");
        }

        const instructor = await tx.query.users.findFirst({
          where: and(
            eq(users.id, input.instructorUserId),
            eq(users.drivingSchoolId, context.schoolId),
            eq(users.role, "INSTRUCTOR"),
          ),
          columns: { id: true },
        });

        if (!instructor) throw new Error("INVALID_INSTRUCTOR");

        const instructorProfile = await tx.query.instructorProfiles.findFirst({
          where: eq(instructorProfiles.userId, instructor.id),
          columns: { id: true },
        });

        if (!instructorProfile) throw new Error("INVALID_INSTRUCTOR");

        const existingStudentProfile = await tx.query.studentProfiles.findFirst({
          where: eq(studentProfiles.userId, targetUserId),
          columns: { id: true },
        });

        if (existingStudentProfile) {
          await tx.update(studentProfiles)
            .set({ instructorId: instructorProfile.id })
            .where(eq(studentProfiles.userId, targetUserId));
        } else {
          await tx.insert(studentProfiles).values({
            userId: targetUserId,
            instructorId: instructorProfile.id,
            completedHours: 0,
          });
        }
      } else {
        await tx.delete(studentProfiles).where(eq(studentProfiles.userId, targetUserId));
      }

      if (nextRole === "INSTRUCTOR" || (nextRole === "SCHOOLADMIN" && input.hasInstructorPrivileges)) {
        const existingInstructorProfile = await tx.query.instructorProfiles.findFirst({
          where: eq(instructorProfiles.userId, targetUserId),
          columns: { id: true },
        });

        if (!existingInstructorProfile) {
          await tx.insert(instructorProfiles).values({ userId: targetUserId });
        }
      } else {
        await tx.delete(instructorProfiles).where(eq(instructorProfiles.userId, targetUserId));
      }

      const [saved] = await tx.update(users)
        .set({
          email,
          name,
          role: nextRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning();

      return saved;
    }).catch((error: Error) => {
      if (error.message === "MISSING_INSTRUCTOR") return { error: "MISSING_INSTRUCTOR" as const };
      if (error.message === "INVALID_INSTRUCTOR") return { error: "INVALID_INSTRUCTOR" as const };
      throw error;
    });

    if ("error" in updated) {
      if (updated.error === "MISSING_INSTRUCTOR") return { status: "MISSING_INSTRUCTOR" as const };
      return { status: "INVALID_INSTRUCTOR" as const };
    }

    return { status: "SUCCESS" as const, userId: updated.id };
  }

  static async deleteSchoolPerson(actorUserId: string, targetUserId: string) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    if (actorUserId === targetUserId) {
      return { status: "CANNOT_DELETE_SELF" as const };
    }

    const target = await db.query.users.findFirst({
      where: and(eq(users.id, targetUserId), eq(users.drivingSchoolId, context.schoolId)),
      columns: { id: true },
    });

    if (!target) return { status: "USER_NOT_FOUND" as const };

    await db.delete(studentProfiles).where(eq(studentProfiles.userId, targetUserId));
    await db.delete(instructorProfiles).where(eq(instructorProfiles.userId, targetUserId));
    await db.delete(users).where(eq(users.id, targetUserId));

    return { status: "SUCCESS" as const };
  }

  static async hasInstructorPrivileges(userId: string) {
    const row = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.userId, userId),
      columns: { id: true },
    });

    return Boolean(row);
  }

  static async listInstructorStudents(actorUserId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return null;

    const studentRows = await db.query.studentProfiles.findMany({
      where: eq(studentProfiles.instructorId, context.instructorProfileId),
      columns: {
        id: true,
        userId: true,
        completedHours: true,
      },
      orderBy: [asc(studentProfiles.id)],
    });

    if (studentRows.length === 0) {
      return {
        students: [] as InstructorStudentListItem[],
        totalStudents: 0,
        maxStudents: MAX_INSTRUCTOR_STUDENTS,
      };
    }

    const studentUserIds = studentRows.map((row) => row.userId);
    const studentUsers = await db.query.users.findMany({
      where: inArray(users.id, studentUserIds),
      columns: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const studentUserById = new Map(studentUsers.map((row) => [row.id, row] as const));
    const profileIds = studentRows.map((row) => row.id);

    const completedLessons =
      profileIds.length > 0
        ? await db.query.studentLessons.findMany({
          where: inArray(studentLessons.studentProfileId, profileIds),
          columns: {
            studentProfileId: true,
            startTime: true,
            endTime: true,
          },
        })
        : [];

    const completedHoursByProfileId = new Map<string, number>();
    for (const lesson of completedLessons) {
      const durationMs = lesson.endTime.getTime() - lesson.startTime.getTime();
      const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
      const current = completedHoursByProfileId.get(lesson.studentProfileId) ?? 0;
      completedHoursByProfileId.set(lesson.studentProfileId, current + durationHours);
    }

    const mappedStudents: InstructorStudentListItem[] = studentRows
      .map((row) => {
        const user = studentUserById.get(row.userId);
        if (!user) return null;
        const computedCompletedHours = Math.round(completedHoursByProfileId.get(row.id) ?? row.completedHours ?? 0);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          completedHours: computedCompletedHours,
        };
      })
      .filter((row): row is InstructorStudentListItem => Boolean(row))
      .sort((a, b) => {
        const aLabel = (a.name?.trim() || a.username).toLowerCase();
        const bLabel = (b.name?.trim() || b.username).toLowerCase();
        return aLabel.localeCompare(bLabel);
      });

    return {
      students: mappedStudents.slice(0, MAX_INSTRUCTOR_STUDENTS),
      totalStudents: mappedStudents.length,
      maxStudents: MAX_INSTRUCTOR_STUDENTS,
    };
  }

  static async getStudentProgress(actorUserId: string): Promise<{ status: "NOT_FOUND" } | { status: "SUCCESS"; progress: StudentProgressSummary }> {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };

    const completedLessons = await db.query.studentLessons.findMany({
      where: eq(studentLessons.studentProfileId, studentContext.studentProfileId),
      columns: {
        id: true,
        startTime: true,
        endTime: true,
        completedAt: true,
        notes: true,
        rating: true,
      },
      orderBy: [desc(studentLessons.completedAt)],
    });

    const computedHours = Math.round(completedLessons.reduce((sum, lesson) => {
      const durationMs = lesson.endTime.getTime() - lesson.startTime.getTime();
      return sum + Math.max(0, durationMs / (1000 * 60 * 60));
    }, 0));

    const completedHours = Math.max(studentContext.completedHours, computedHours);
    const remainingHours = Math.max(0, REQUIRED_HOURS - completedHours);
    const completionPercent = Math.max(0, Math.min(100, Math.round((completedHours / REQUIRED_HOURS) * 100)));

    return {
      status: "SUCCESS" as const,
      progress: {
        completedHours,
        requiredHours: REQUIRED_HOURS,
        remainingHours,
        completionPercent,
        completedLessons: completedLessons.slice(0, 12).map((lesson) => ({
          id: lesson.id,
          startTime: lesson.startTime.toISOString(),
          endTime: lesson.endTime.toISOString(),
          completedAt: lesson.completedAt.toISOString(),
          notes: lesson.notes ?? null,
          rating: lesson.rating ?? null,
        })),
      },
    };
  }

  static async getStudentInstructors(actorUserId: string): Promise<{ status: "NOT_FOUND" } | { status: "SUCCESS"; summary: StudentInstructorSummary }> {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };

    const [studentUser, instructorProfile] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, actorUserId),
        columns: { drivingSchoolId: true },
      }),
      db.query.instructorProfiles.findFirst({
        where: eq(instructorProfiles.id, studentContext.instructorProfileId),
        columns: { id: true, userId: true },
      }),
    ]);

    const [instructorUser, school] = await Promise.all([
      instructorProfile
        ? db.query.users.findFirst({
          where: eq(users.id, instructorProfile.userId),
          columns: { id: true, username: true, name: true, email: true },
        })
        : null,
      studentUser?.drivingSchoolId
        ? db.query.schools.findFirst({
          where: eq(schools.id, studentUser.drivingSchoolId),
          columns: { id: true, name: true, rating: true, address: true, phone: true },
        })
        : null,
    ]);

    return {
      status: "SUCCESS" as const,
      summary: {
        instructor: instructorUser
          ? {
            userId: instructorUser.id,
            username: instructorUser.username,
            name: instructorUser.name,
            email: instructorUser.email,
          }
          : null,
        school: school
          ? {
            id: school.id,
            name: school.name,
            rating: school.rating,
            address: school.address,
            phone: school.phone,
          }
          : null,
        completedHours: studentContext.completedHours,
        requiredHours: REQUIRED_HOURS,
      },
    };
  }

  static async fetchInstructorSchedule(actorUserId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const row = await db.query.workSchedules.findFirst({
      where: eq(workSchedules.instructorId, context.instructorProfileId),
      columns: { schedule: true },
    });

    if (!row) return { status: "EMPTY" as const };

    const payload = row.schedule as Record<string, unknown> | null;
    const days = this.normalizeInstructorScheduleDays(payload?.days);
    return { status: "SUCCESS" as const, schedule: { days } };
  }

  static async saveInstructorSchedule(actorUserId: string, input: InstructorSchedulePayload) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };
    if (!input?.days) return { status: "VALIDATION_ERROR" as const };

    const days = this.normalizeInstructorScheduleDays(input.days);
    const entries = Object.entries(days) as Array<[InstructorScheduleDayKey, InstructorScheduleDays[keyof InstructorScheduleDays]]>;
    const enabled = entries.filter(([, value]) => value.enabled);
    if (enabled.length === 0) return { status: "VALIDATION_ERROR" as const };

    for (const [, value] of enabled) {
      if (!this.isClock(value.startTime) || !this.isClock(value.endTime) || value.endTime <= value.startTime) {
        return { status: "VALIDATION_ERROR" as const };
      }
    }

    await db
      .insert(workSchedules)
      .values({
        instructorId: context.instructorProfileId,
        schedule: { days },
      })
      .onConflictDoUpdate({
        target: workSchedules.instructorId,
        set: {
          schedule: { days },
        },
      });

    await this.emitScheduleChanged(context.instructorProfileId, {
      kind: "WORK_SCHEDULE_UPDATED",
    });

    const refreshed = await this.fetchInstructorSchedule(actorUserId);
    if (refreshed.status !== "SUCCESS") return { status: "SUCCESS" as const, schedule: { days: this.getDefaultInstructorScheduleDays() } };
    return { status: "SUCCESS" as const, schedule: refreshed.schedule };
  }

  static async getInstructorScheduleWorkflow(actorUserId: string, weekStartInput?: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const weekStartDate = this.getWeekStartDate(weekStartInput);
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const expectedStudents = await this.listInstructorStudentProfiles(context.instructorProfileId);

    const cycle = await db.query.scheduleCycles.findFirst({
      where: and(
        eq(scheduleCycles.instructorId, context.instructorProfileId),
        gte(scheduleCycles.weekStartDate, weekStartDate),
        lt(scheduleCycles.weekStartDate, weekEndDate),
      ),
      orderBy: [desc(scheduleCycles.weekStartDate)],
      columns: {
        id: true,
        status: true,
        weekStartDate: true,
        scheduleSnapshot: true,
        sentAt: true,
        allocationStartedAt: true,
        allocationCompletedAt: true,
        publishedAt: true,
      },
    });

    if (!cycle) {
      return {
        status: "SUCCESS" as const,
        workflow: {
          cycle: null,
          expectedReplies: expectedStudents.length,
          repliesReceived: 0,
          allocatedSlots: 0,
          weekStartDate: weekStartDate.toISOString(),
        },
      };
    }

    const [replies, slots] = await Promise.all([
      db.query.studentScheduleReplies.findMany({
        where: eq(studentScheduleReplies.cycleId, cycle.id),
        columns: { id: true },
      }),
      db.query.timeSlots.findMany({
        where: eq(timeSlots.scheduleCycleId, cycle.id),
        columns: { id: true },
      }),
    ]);

    const parsed = this.parseCycleSnapshot(cycle.scheduleSnapshot);

    return {
      status: "SUCCESS" as const,
      workflow: {
        cycle: {
          id: cycle.id,
          status: cycle.status as ScheduleCycleStatus,
          weekStartDate: cycle.weekStartDate.toISOString(),
          days: parsed.days,
          slotBlueprint: parsed.slotBlueprint,
          sentAt: cycle.sentAt?.toISOString() ?? null,
          allocationStartedAt: cycle.allocationStartedAt?.toISOString() ?? null,
          allocationCompletedAt: cycle.allocationCompletedAt?.toISOString() ?? null,
          publishedAt: cycle.publishedAt?.toISOString() ?? null,
        },
        expectedReplies: expectedStudents.length,
        repliesReceived: replies.length,
        allocatedSlots: slots.length,
        weekStartDate: weekStartDate.toISOString(),
      },
    };
  }

  static async sendInstructorScheduleToStudents(actorUserId: string, input: SendInstructorSchedulePayload) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };
    if (!input?.days) return { status: "VALIDATION_ERROR" as const };

    const weekStartDate = this.getWeekStartDate(input.weekStartDate);
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const days = this.normalizeInstructorScheduleDays(input.days);
    const enabledCount = DAY_KEYS.filter((dayKey) => days[dayKey].enabled).length;
    if (enabledCount === 0) return { status: "VALIDATION_ERROR" as const };

    const slotBlueprint = this.normalizeScheduleSlotBlueprint(input.slotBlueprint, days);
    const now = new Date();

    await db
      .insert(scheduleCycles)
      .values({
        instructorId: context.instructorProfileId,
        weekStartDate,
        status: "SENT_TO_STUDENTS",
        scheduleSnapshot: { days, slotBlueprint },
        sentAt: now,
        allocationStartedAt: null,
        allocationCompletedAt: null,
        publishedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [scheduleCycles.instructorId, scheduleCycles.weekStartDate],
        set: {
          status: "SENT_TO_STUDENTS",
          scheduleSnapshot: { days, slotBlueprint },
          sentAt: now,
          allocationStartedAt: null,
          allocationCompletedAt: null,
          publishedAt: null,
          updatedAt: now,
        },
      });

    const cycle = await db.query.scheduleCycles.findFirst({
      where: and(
        eq(scheduleCycles.instructorId, context.instructorProfileId),
        gte(scheduleCycles.weekStartDate, weekStartDate),
        lt(scheduleCycles.weekStartDate, weekEndDate),
      ),
      orderBy: [desc(scheduleCycles.weekStartDate)],
      columns: { id: true },
    });

    if (!cycle) return { status: "VALIDATION_ERROR" as const };

    const existingSlots = await db.query.timeSlots.findMany({
      where: eq(timeSlots.scheduleCycleId, cycle.id),
      columns: { id: true },
    });

    if (existingSlots.length > 0) {
      await db.delete(lessonSessions).where(inArray(lessonSessions.timeSlotId, existingSlots.map((slot) => slot.id)));
      await db.delete(timeSlots).where(eq(timeSlots.scheduleCycleId, cycle.id));
    }

    await db.delete(studentScheduleReplies).where(eq(studentScheduleReplies.cycleId, cycle.id));

    await this.emitScheduleChanged(context.instructorProfileId, {
      kind: "SCHEDULE_CYCLE_UPDATED",
      cycleId: cycle.id,
      weekStartDate: weekStartDate.toISOString(),
    });

    const workflow = await this.getInstructorScheduleWorkflow(actorUserId, weekStartDate.toISOString());
    if (workflow.status !== "SUCCESS") {
      return { status: "SUCCESS" as const, workflow: null };
    }

    return { status: "SUCCESS" as const, workflow: workflow.workflow };
  }

  static async fetchStudentScheduleCycle(actorUserId: string, weekStartInput?: string) {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };

    const weekStartDate = this.getWeekStartDate(weekStartInput);
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const cycle = await db.query.scheduleCycles.findFirst({
      where: and(
        eq(scheduleCycles.instructorId, studentContext.instructorProfileId),
        gte(scheduleCycles.weekStartDate, weekStartDate),
        lt(scheduleCycles.weekStartDate, weekEndDate),
        ne(scheduleCycles.status, "DRAFT"),
      ),
      orderBy: [desc(scheduleCycles.weekStartDate)],
      columns: {
        id: true,
        status: true,
        weekStartDate: true,
        scheduleSnapshot: true,
        sentAt: true,
      },
    });

    if (!cycle) return { status: "EMPTY" as const };

    const [reply, assignedSlots] = await Promise.all([
      db.query.studentScheduleReplies.findFirst({
        where: and(
          eq(studentScheduleReplies.cycleId, cycle.id),
          eq(studentScheduleReplies.studentProfileId, studentContext.studentProfileId),
        ),
        columns: { unavailableSlotKeys: true, submittedAt: true },
      }),
      db.query.timeSlots.findMany({
        where: and(
          eq(timeSlots.scheduleCycleId, cycle.id),
          eq(timeSlots.studentId, studentContext.studentProfileId),
        ),
        orderBy: [asc(timeSlots.startTime)],
        columns: {
          id: true,
          startTime: true,
          endTime: true,
          isDone: true,
          dayKey: true,
          slotKey: true,
        },
      }),
    ]);

    const sessionMap = new Map<string, LessonSessionState>();
    if (assignedSlots.length > 0) {
      const sessions = await db.query.lessonSessions.findMany({
        where: inArray(lessonSessions.timeSlotId, assignedSlots.map((slot) => slot.id)),
        columns: { timeSlotId: true, state: true },
      });

      for (const session of sessions) {
        sessionMap.set(session.timeSlotId, session.state as LessonSessionState);
      }
    }

    const parsed = this.parseCycleSnapshot(cycle.scheduleSnapshot);

    return {
      status: "SUCCESS" as const,
      schedule: {
        cycle: {
          id: cycle.id,
          status: cycle.status as ScheduleCycleStatus,
          weekStartDate: cycle.weekStartDate.toISOString(),
          sentAt: cycle.sentAt?.toISOString() ?? null,
        },
        days: parsed.days,
        slotBlueprint: parsed.slotBlueprint,
        reply: {
          unavailableSlotKeys: this.normalizeUnavailableSlotKeys(reply?.unavailableSlotKeys),
          submittedAt: reply?.submittedAt?.toISOString() ?? null,
        },
        assignedSlots: assignedSlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          dayKey: slot.dayKey,
          slotKey: slot.slotKey,
          isDone: slot.isDone,
          state: sessionMap.get(slot.id) ?? (slot.isDone ? "COMPLETED" : "PLANNED"),
        })),
      },
    };
  }

  static async submitStudentScheduleAvailability(actorUserId: string, input: StudentAvailabilityPayload) {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };
    if (!input?.cycleId) return { status: "VALIDATION_ERROR" as const };

    const cycle = await db.query.scheduleCycles.findFirst({
      where: eq(scheduleCycles.id, input.cycleId),
      columns: { id: true, instructorId: true, status: true, weekStartDate: true },
    });

    if (!cycle) return { status: "CYCLE_NOT_FOUND" as const };
    if (cycle.instructorId !== studentContext.instructorProfileId) return { status: "FORBIDDEN" as const };
    if (cycle.status === "DRAFT") return { status: "INVALID_STATE" as const };

    const expectedStudents = await this.listInstructorStudentProfiles(cycle.instructorId);
    const expectedStudentIds = new Set(expectedStudents.map((student) => student.id));
    if (!expectedStudentIds.has(studentContext.studentProfileId)) return { status: "FORBIDDEN" as const };

    const unavailableSlotKeys = this.normalizeUnavailableSlotKeys(input.unavailableSlotKeys);
    const now = new Date();

    await db
      .insert(studentScheduleReplies)
      .values({
        cycleId: cycle.id,
        studentProfileId: studentContext.studentProfileId,
        unavailableSlotKeys,
        submittedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [studentScheduleReplies.cycleId, studentScheduleReplies.studentProfileId],
        set: {
          unavailableSlotKeys,
          submittedAt: now,
          updatedAt: now,
        },
      });

    const replies = await db.query.studentScheduleReplies.findMany({
      where: eq(studentScheduleReplies.cycleId, cycle.id),
      columns: { studentProfileId: true },
    });

    const replyCount = replies.filter((reply) => expectedStudentIds.has(reply.studentProfileId)).length;
    const expectedCount = expectedStudents.length;

    const nextStatus: ScheduleCycleStatus =
      expectedCount > 0 && replyCount >= expectedCount
        ? "READY_TO_ALLOCATE"
        : "COLLECTING_RESPONSES";

    await db
      .update(scheduleCycles)
      .set({
        status: nextStatus,
        updatedAt: now,
      })
      .where(eq(scheduleCycles.id, cycle.id));

    await this.emitScheduleChanged(cycle.instructorId, {
      kind: "STUDENT_AVAILABILITY_UPDATED",
      cycleId: cycle.id,
      weekStartDate: cycle.weekStartDate.toISOString(),
    });

    return {
      status: "SUCCESS" as const,
      summary: {
        cycleId: cycle.id,
        status: nextStatus,
        repliesReceived: replyCount,
        expectedReplies: expectedCount,
      },
    };
  }

  static async allocateInstructorSchedule(actorUserId: string, cycleId?: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const weekStartDate = this.getWeekStartDate();
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const cycle = cycleId
      ? await db.query.scheduleCycles.findFirst({
        where: and(eq(scheduleCycles.id, cycleId), eq(scheduleCycles.instructorId, context.instructorProfileId)),
        columns: {
          id: true,
          status: true,
          weekStartDate: true,
          scheduleSnapshot: true,
        },
      })
      : await db.query.scheduleCycles.findFirst({
        where: and(
          eq(scheduleCycles.instructorId, context.instructorProfileId),
          gte(scheduleCycles.weekStartDate, weekStartDate),
          lt(scheduleCycles.weekStartDate, weekEndDate),
        ),
        orderBy: [desc(scheduleCycles.weekStartDate)],
        columns: {
          id: true,
          status: true,
          weekStartDate: true,
          scheduleSnapshot: true,
        },
      });

    if (!cycle) return { status: "CYCLE_NOT_FOUND" as const };

    const expectedStudents = await this.listInstructorStudentProfiles(context.instructorProfileId);
    const activeStudents = expectedStudents.filter((student) => student.completedHours < REQUIRED_HOURS);
    if (activeStudents.length === 0) return { status: "NO_ACTIVE_STUDENTS" as const };

    const replies = await db.query.studentScheduleReplies.findMany({
      where: eq(studentScheduleReplies.cycleId, cycle.id),
      columns: { studentProfileId: true, unavailableSlotKeys: true },
    });

    const replyMap = new Map<string, Record<InstructorScheduleDayKey, string[]>>();
    for (const reply of replies) {
      replyMap.set(reply.studentProfileId, this.normalizeUnavailableSlotKeys(reply.unavailableSlotKeys));
    }

    const parsed = this.parseCycleSnapshot(cycle.scheduleSnapshot);

    const flatSlots = DAY_KEYS.flatMap((dayKey) =>
      (parsed.slotBlueprint[dayKey] ?? []).map((slot) => ({ dayKey, slot })),
    ).sort((a, b) => {
      const dayCompare = this.getDayIndex(a.dayKey) - this.getDayIndex(b.dayKey);
      if (dayCompare !== 0) return dayCompare;
      return a.slot.startTime.localeCompare(b.slot.startTime);
    });

    const slotRows = flatSlots
      .map((item, index) => {
        const startDate = this.toSlotDateTime(cycle.weekStartDate, item.dayKey, item.slot.startTime);
        const endDate = this.toSlotDateTime(cycle.weekStartDate, item.dayKey, item.slot.endTime);
        if (!startDate || !endDate) return null;
        return {
          index,
          dayKey: item.dayKey,
          slotKey: item.slot.key,
          startTime: startDate,
          endTime: endDate,
        };
      })
      .filter((row): row is {
        index: number;
        dayKey: InstructorScheduleDayKey;
        slotKey: string;
        startTime: Date;
        endTime: Date;
      } => Boolean(row));

    const MAX_DAILY_HOURS_PER_STUDENT = 2;
    const completedHoursByStudent = new Map(activeStudents.map((student) => [student.id, student.completedHours]));
    const requiredHoursByStudent = new Map(
      activeStudents.map((student) => [student.id, Math.max(1, REQUIRED_HOURS - student.completedHours)]),
    );

    const baseCandidateIdsBySlot = slotRows.map((slotRow) =>
      activeStudents
        .filter((student) => {
          const unavailable = replyMap.get(student.id)?.[slotRow.dayKey] ?? [];
          return !unavailable.includes(slotRow.slotKey);
        })
        .map((student) => student.id),
    );
    const baseCandidateSetBySlot = baseCandidateIdsBySlot.map((rows) => new Set(rows));

    const slotAssignments: Array<string | null> = Array.from({ length: slotRows.length }, () => null);

    const assignedCountByStudent = new Map<string, number>();
    const assignedCountByStudentDay = new Map<string, Record<InstructorScheduleDayKey, number>>();
    const assignedSlotIndexesByStudent = new Map<string, Set<number>>();

    for (const student of activeStudents) {
      assignedCountByStudent.set(student.id, 0);
      assignedSlotIndexesByStudent.set(student.id, new Set<number>());
      assignedCountByStudentDay.set(
        student.id,
        DAY_KEYS.reduce((acc, dayKey) => {
          acc[dayKey] = 0;
          return acc;
        }, {} as Record<InstructorScheduleDayKey, number>),
      );
    }

    const getDayCount = (studentId: string, dayKey: InstructorScheduleDayKey) =>
      assignedCountByStudentDay.get(studentId)?.[dayKey] ?? 0;

    const getRemainingRequiredHours = (studentId: string) => {
      const required = requiredHoursByStudent.get(studentId) ?? 0;
      const assigned = assignedCountByStudent.get(studentId) ?? 0;
      return Math.max(0, required - assigned);
    };

    const canAssignDirect = (studentId: string, slotIndex: number) => {
      if (!baseCandidateSetBySlot[slotIndex]?.has(studentId)) return false;
      if (getRemainingRequiredHours(studentId) <= 0) return false;
      const dayKey = slotRows[slotIndex]?.dayKey;
      if (!dayKey) return false;
      return getDayCount(studentId, dayKey) < MAX_DAILY_HOURS_PER_STUDENT;
    };

    const assignSlot = (studentId: string, slotIndex: number) => {
      if (slotAssignments[slotIndex]) return false;
      const slot = slotRows[slotIndex];
      if (!slot) return false;

      slotAssignments[slotIndex] = studentId;
      assignedCountByStudent.set(studentId, (assignedCountByStudent.get(studentId) ?? 0) + 1);

      const byDay = assignedCountByStudentDay.get(studentId);
      if (byDay) {
        byDay[slot.dayKey] = (byDay[slot.dayKey] ?? 0) + 1;
      }

      assignedSlotIndexesByStudent.get(studentId)?.add(slotIndex);
      return true;
    };

    const unassignSlot = (slotIndex: number) => {
      const current = slotAssignments[slotIndex];
      if (!current) return null;
      const slot = slotRows[slotIndex];
      if (!slot) return null;

      slotAssignments[slotIndex] = null;
      assignedCountByStudent.set(current, Math.max(0, (assignedCountByStudent.get(current) ?? 0) - 1));

      const byDay = assignedCountByStudentDay.get(current);
      if (byDay) {
        byDay[slot.dayKey] = Math.max(0, (byDay[slot.dayKey] ?? 0) - 1);
      }

      assignedSlotIndexesByStudent.get(current)?.delete(slotIndex);
      return current;
    };

    const countRemainingUnassignedSlots = (fromSlotIndex: number) => {
      let remaining = 0;
      for (let i = fromSlotIndex; i < slotRows.length; i += 1) {
        if (!slotAssignments[i]) remaining += 1;
      }
      return remaining;
    };

    const calculatePotentialHoursUntilWeekEnd = (studentId: string, fromSlotIndex: number) => {
      // Keep students who already reached target out of candidate ranking.
      if (getRemainingRequiredHours(studentId) <= 0) return 0;

      const dayCapacityLeft = DAY_KEYS.reduce((acc, dayKey) => {
        acc[dayKey] = Math.max(0, MAX_DAILY_HOURS_PER_STUDENT - getDayCount(studentId, dayKey));
        return acc;
      }, {} as Record<InstructorScheduleDayKey, number>);

      let potential = 0;
      for (let i = fromSlotIndex; i < slotRows.length; i += 1) {
        if (slotAssignments[i]) continue;
        if (!baseCandidateSetBySlot[i]?.has(studentId)) continue;
        const dayKey = slotRows[i]?.dayKey;
        if (!dayKey) continue;
        if ((dayCapacityLeft[dayKey] ?? 0) <= 0) continue;
        dayCapacityLeft[dayKey] -= 1;
        potential += 1;
      }
      return potential;
    };

    const getCoefficient = (studentId: string, fromSlotIndex: number) => {
      // Coefficient = {hours student can attend from current slot to week end}
      //               / {all remaining unassigned slots in same horizon}.
      const remainingSlots = Math.max(1, countRemainingUnassignedSlots(fromSlotIndex));
      const potentialHours = calculatePotentialHoursUntilWeekEnd(studentId, fromSlotIndex);
      return {
        value: potentialHours / remainingSlots,
        potentialHours,
        remainingSlots,
      };
    };

    const compareCandidatesByCoefficient = (aStudentId: string, bStudentId: string, slotIndex: number) => {
      const a = getCoefficient(aStudentId, slotIndex);
      const b = getCoefficient(bStudentId, slotIndex);

      if (a.value !== b.value) return a.value - b.value;
      if (a.potentialHours !== b.potentialHours) return a.potentialHours - b.potentialHours;
      if (a.remainingSlots !== b.remainingSlots) return a.remainingSlots - b.remainingSlots;

      const aAssigned = assignedCountByStudent.get(aStudentId) ?? 0;
      const bAssigned = assignedCountByStudent.get(bStudentId) ?? 0;
      if (aAssigned !== bAssigned) return aAssigned - bAssigned;

      const aCompleted = completedHoursByStudent.get(aStudentId) ?? 0;
      const bCompleted = completedHoursByStudent.get(bStudentId) ?? 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;

      return aStudentId.localeCompare(bStudentId);
    };

    const tryRearrangeForSlot = (targetSlotIndex: number) => {
      const targetSlot = slotRows[targetSlotIndex];
      if (!targetSlot) return false;
      if (slotAssignments[targetSlotIndex]) return true;

      const candidates = (baseCandidateIdsBySlot[targetSlotIndex] ?? [])
        .slice()
        .sort((a, b) => compareCandidatesByCoefficient(a, b, targetSlotIndex));

      for (const candidateId of candidates) {
        if (canAssignDirect(candidateId, targetSlotIndex)) {
          return assignSlot(candidateId, targetSlotIndex);
        }

        const candidateAssignedSlots = Array.from(assignedSlotIndexesByStudent.get(candidateId) ?? []);
        if (candidateAssignedSlots.length === 0) continue;

        const needsWeeklyRelief = getRemainingRequiredHours(candidateId) <= 0;
        const needsDayRelief = getDayCount(candidateId, targetSlot.dayKey) >= MAX_DAILY_HOURS_PER_STUDENT;
        if (!needsWeeklyRelief && !needsDayRelief) continue;

        const movableSlots = candidateAssignedSlots
          .filter((slotIndex) => {
            if (!needsDayRelief) return true;
            return slotRows[slotIndex]?.dayKey === targetSlot.dayKey;
          })
          .sort((a, b) => {
            const aAlternatives = (baseCandidateIdsBySlot[a] ?? []).filter((id) => id !== candidateId).length;
            const bAlternatives = (baseCandidateIdsBySlot[b] ?? []).filter((id) => id !== candidateId).length;
            if (aAlternatives !== bAlternatives) return bAlternatives - aAlternatives;
            return a - b;
          });

        for (const occupiedSlotIndex of movableSlots) {
          const removedStudentId = unassignSlot(occupiedSlotIndex);
          if (removedStudentId !== candidateId) {
            if (removedStudentId) assignSlot(removedStudentId, occupiedSlotIndex);
            continue;
          }

          const alternatives = (baseCandidateIdsBySlot[occupiedSlotIndex] ?? [])
            .filter((studentId) => studentId !== candidateId)
            .filter((studentId) => canAssignDirect(studentId, occupiedSlotIndex))
            .sort((a, b) => compareCandidatesByCoefficient(a, b, occupiedSlotIndex));

          let movedToAlternative = false;
          for (const alternativeId of alternatives) {
            if (assignSlot(alternativeId, occupiedSlotIndex)) {
              movedToAlternative = true;
              break;
            }
          }

          if (!movedToAlternative) {
            assignSlot(candidateId, occupiedSlotIndex);
            continue;
          }

          if (canAssignDirect(candidateId, targetSlotIndex) && assignSlot(candidateId, targetSlotIndex)) {
            return true;
          }

          const rollbackAlternative = unassignSlot(occupiedSlotIndex);
          if (rollbackAlternative) {
            assignSlot(candidateId, occupiedSlotIndex);
          }
        }
      }

      return false;
    };

    // Pass 1: assign slots where exactly one student can attend (no overlap).
    const uniqueCandidateSlotIndexes: number[] = [];
    const overlappingCandidateSlotIndexes: number[] = [];

    baseCandidateIdsBySlot.forEach((candidateIds, slotIndex) => {
      if (candidateIds.length === 1) {
        uniqueCandidateSlotIndexes.push(slotIndex);
      } else if (candidateIds.length > 1) {
        overlappingCandidateSlotIndexes.push(slotIndex);
      }
    });

    for (const slotIndex of uniqueCandidateSlotIndexes) {
      const onlyCandidateId = baseCandidateIdsBySlot[slotIndex]?.[0];
      if (!onlyCandidateId) continue;
      if (canAssignDirect(onlyCandidateId, slotIndex)) {
        assignSlot(onlyCandidateId, slotIndex);
      }
    }

    // Pass 2: assign overlapping slots using coefficient:
    // {potential attendable hours until week end}/{remaining unassigned slots in same horizon}.
    for (const slotIndex of overlappingCandidateSlotIndexes) {
      if (slotAssignments[slotIndex]) continue;

      const candidates = (baseCandidateIdsBySlot[slotIndex] ?? [])
        .filter((studentId) => canAssignDirect(studentId, slotIndex))
        .sort((a, b) => compareCandidatesByCoefficient(a, b, slotIndex));

      const selectedCandidate = candidates[0] ?? null;
      if (selectedCandidate) {
        assignSlot(selectedCandidate, slotIndex);
      }
    }

    // Pass 3: try local rearrangement to fill gaps created by greedy ordering.
    for (let slotIndex = 0; slotIndex < slotRows.length; slotIndex += 1) {
      if (slotAssignments[slotIndex]) continue;
      tryRearrangeForSlot(slotIndex);
    }

    const rowsToInsert: Array<typeof timeSlots.$inferInsert> = slotRows.map((slotRow, slotIndex) => ({
      scheduleCycleId: cycle.id,
      instructorId: context.instructorProfileId,
      studentId: slotAssignments[slotIndex],
      startTime: slotRow.startTime,
      endTime: slotRow.endTime,
      isDone: false,
      dayKey: slotRow.dayKey,
      slotKey: slotRow.slotKey,
    }));

    const existingSlots = await db.query.timeSlots.findMany({
      where: eq(timeSlots.scheduleCycleId, cycle.id),
      columns: { id: true },
    });

    if (existingSlots.length > 0) {
      await db.delete(lessonSessions).where(inArray(lessonSessions.timeSlotId, existingSlots.map((slot) => slot.id)));
      await db.delete(timeSlots).where(eq(timeSlots.scheduleCycleId, cycle.id));
    }

    if (rowsToInsert.length > 0) {
      await db.insert(timeSlots).values(rowsToInsert);
    }

    const now = new Date();
    await db
      .update(scheduleCycles)
      .set({
        status: "ALLOCATED",
        allocationStartedAt: now,
        allocationCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(scheduleCycles.id, cycle.id));

    await this.emitScheduleChanged(context.instructorProfileId, {
      kind: "SCHEDULE_CYCLE_UPDATED",
      cycleId: cycle.id,
      weekStartDate: cycle.weekStartDate.toISOString(),
    });

    return {
      status: "SUCCESS" as const,
      allocation: {
        cycleId: cycle.id,
        totalSlots: rowsToInsert.length,
        assignedSlots: rowsToInsert.filter((row) => Boolean(row.studentId)).length,
        unassignedSlots: rowsToInsert.filter((row) => !row.studentId).length,
      },
    };
  }

  static async listInstructorLessons(actorUserId: string, weekStartInput?: string): Promise<any> {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const weekStartDate = this.getWeekStartDate(weekStartInput);
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const slots = await db.query.timeSlots.findMany({
      where: and(
        eq(timeSlots.instructorId, context.instructorProfileId),
        gte(timeSlots.startTime, weekStartDate),
        lt(timeSlots.startTime, weekEndDate),
      ),
      orderBy: [asc(timeSlots.startTime)],
      columns: {
        id: true,
        studentId: true,
        startTime: true,
        endTime: true,
        isDone: true,
        dayKey: true,
        slotKey: true,
      },
    });

    if (slots.length > 0) {
      const updated = await this.autoCompleteElapsedLessons(slots.map((slot) => ({
        id: slot.id,
        instructorId: context.instructorProfileId,
        studentId: slot.studentId ?? null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isDone: slot.isDone,
      })));
      if (updated) {
        return this.listInstructorLessons(actorUserId, weekStartInput);
      }
    }

    const sessionStateMap = new Map<string, LessonSessionState>();
    if (slots.length > 0) {
      const sessions = await db.query.lessonSessions.findMany({
        where: inArray(lessonSessions.timeSlotId, slots.map((slot) => slot.id)),
        columns: { timeSlotId: true, state: true },
      });

      for (const session of sessions) {
        sessionStateMap.set(session.timeSlotId, session.state as LessonSessionState);
      }
    }

    const studentProfileIds = Array.from(
      new Set(
        slots
          .map((slot) => slot.studentId)
          .filter((studentId): studentId is string => Boolean(studentId)),
      ),
    );

    const studentDisplayByProfileId = new Map<string, { studentUserId: string; studentName: string | null; studentUsername: string | null }>();
    if (studentProfileIds.length > 0) {
      const assignedProfiles = await db.query.studentProfiles.findMany({
        where: inArray(studentProfiles.id, studentProfileIds),
        columns: { id: true, userId: true },
      });

      const assignedUserIds = Array.from(new Set(assignedProfiles.map((profile) => profile.userId)));
      const assignedUsers =
        assignedUserIds.length > 0
          ? await db.query.users.findMany({
            where: inArray(users.id, assignedUserIds),
            columns: { id: true, name: true, username: true },
          })
          : [];

      const userById = new Map(assignedUsers.map((user) => [user.id, user] as const));
      for (const profile of assignedProfiles) {
        const user = userById.get(profile.userId);
        studentDisplayByProfileId.set(profile.id, {
          studentUserId: profile.userId,
          studentName: user?.name ?? null,
          studentUsername: user?.username ?? null,
        });
      }
    }

    return {
      status: "SUCCESS" as const,
      lessons: slots.map((slot) => ({
        ...(slot.studentId ? studentDisplayByProfileId.get(slot.studentId) : {}),
        id: slot.id,
        studentId: slot.studentId,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        dayKey: slot.dayKey,
        slotKey: slot.slotKey,
        isDone: slot.isDone,
        state: sessionStateMap.get(slot.id) ?? (slot.isDone ? "COMPLETED" : "PLANNED"),
      })),
    };
  }

  static async getInstructorLessonCandidates(actorUserId: string, timeSlotId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const slot = await db.query.timeSlots.findFirst({
      where: and(eq(timeSlots.id, timeSlotId), eq(timeSlots.instructorId, context.instructorProfileId)),
      columns: {
        id: true,
        scheduleCycleId: true,
        studentId: true,
        dayKey: true,
        slotKey: true,
      },
    });

    if (!slot || !slot.scheduleCycleId || !slot.dayKey || !slot.slotKey) {
      return { status: "LESSON_NOT_FOUND" as const };
    }

    const students = await this.listInstructorStudentProfiles(context.instructorProfileId);
    if (students.length === 0) {
      return {
        status: "SUCCESS" as const,
        details: {
          assignedStudent: null,
          candidates: [],
        },
      };
    }

    const studentProfileIds = students.map((student) => student.id);
    const [replies, studentUsers] = await Promise.all([
      db.query.studentScheduleReplies.findMany({
        where: eq(studentScheduleReplies.cycleId, slot.scheduleCycleId),
        columns: { studentProfileId: true, unavailableSlotKeys: true },
      }),
      db.query.users.findMany({
        where: inArray(users.id, students.map((student) => student.userId)),
        columns: { id: true, name: true, username: true },
      }),
    ]);

    const userById = new Map(studentUsers.map((user) => [user.id, user] as const));
    const replyMap = new Map<string, Record<InstructorScheduleDayKey, string[]>>();
    for (const reply of replies) {
      replyMap.set(reply.studentProfileId, this.normalizeUnavailableSlotKeys(reply.unavailableSlotKeys));
    }

    const assignedStudentProfile = slot.studentId
      ? students.find((student) => student.id === slot.studentId) ?? null
      : null;

    const assignedStudent = assignedStudentProfile
      ? {
        profileId: assignedStudentProfile.id,
        userId: assignedStudentProfile.userId,
        name: userById.get(assignedStudentProfile.userId)?.name ?? null,
        username: userById.get(assignedStudentProfile.userId)?.username ?? null,
      }
      : null;

    const candidates = studentProfileIds
      .filter((profileId) => profileId !== slot.studentId)
      .map((profileId) => {
        const profile = students.find((student) => student.id === profileId);
        if (!profile) return null;
        const unavailable = replyMap.get(profileId)?.[slot.dayKey as InstructorScheduleDayKey] ?? [];
        if (unavailable.includes(slot.slotKey!)) return null;
        const user = userById.get(profile.userId);
        return {
          profileId: profile.id,
          userId: profile.userId,
          name: user?.name ?? null,
          username: user?.username ?? null,
          completedHours: profile.completedHours,
        };
      })
      .filter((candidate): candidate is {
        profileId: string;
        userId: string;
        name: string | null;
        username: string | null;
        completedHours: number;
      } => Boolean(candidate))
      .sort((a, b) => {
        const aLabel = (a.name?.trim() || a.username || "").toLowerCase();
        const bLabel = (b.name?.trim() || b.username || "").toLowerCase();
        return aLabel.localeCompare(bLabel);
      });

    return {
      status: "SUCCESS" as const,
      details: {
        assignedStudent,
        candidates,
      },
    };
  }

  static async listStudentLessons(actorUserId: string, weekStartInput?: string): Promise<any> {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };

    const weekStartDate = this.getWeekStartDate(weekStartInput);
    if (!weekStartDate) return { status: "VALIDATION_ERROR" as const };
    const weekEndDate = this.getWeekEndDate(weekStartDate);

    const slots = await db.query.timeSlots.findMany({
      where: and(
        eq(timeSlots.studentId, studentContext.studentProfileId),
        gte(timeSlots.startTime, weekStartDate),
        lt(timeSlots.startTime, weekEndDate),
      ),
      orderBy: [asc(timeSlots.startTime)],
      columns: {
        id: true,
        instructorId: true,
        startTime: true,
        endTime: true,
        isDone: true,
        dayKey: true,
        slotKey: true,
      },
    });

    if (slots.length > 0) {
      const updated = await this.autoCompleteElapsedLessons(slots.map((slot) => ({
        id: slot.id,
        instructorId: slot.instructorId,
        studentId: studentContext.studentProfileId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isDone: slot.isDone,
      })));
      if (updated) {
        return this.listStudentLessons(actorUserId, weekStartInput);
      }
    }

    const sessionStateMap = new Map<string, LessonSessionState>();
    if (slots.length > 0) {
      const sessions = await db.query.lessonSessions.findMany({
        where: inArray(lessonSessions.timeSlotId, slots.map((slot) => slot.id)),
        columns: { timeSlotId: true, state: true },
      });

      for (const session of sessions) {
        sessionStateMap.set(session.timeSlotId, session.state as LessonSessionState);
      }
    }

    return {
      status: "SUCCESS" as const,
      lessons: slots.map((slot) => ({
        id: slot.id,
        instructorId: slot.instructorId,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        dayKey: slot.dayKey,
        slotKey: slot.slotKey,
        isDone: slot.isDone,
        state: sessionStateMap.get(slot.id) ?? (slot.isDone ? "COMPLETED" : "PLANNED"),
      })),
    };
  }

  static async issueInstructorLessonStartCode(actorUserId: string, timeSlotId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const slot = await db.query.timeSlots.findFirst({
      where: and(
        eq(timeSlots.id, timeSlotId),
        eq(timeSlots.instructorId, context.instructorProfileId),
      ),
      columns: { id: true, studentId: true, isDone: true, startTime: true, endTime: true },
    });

    if (!slot) return { status: "LESSON_NOT_FOUND" as const };
    if (!slot.studentId) return { status: "UNASSIGNED_SLOT" as const };
    if (slot.isDone) return { status: "INVALID_STATE" as const };

    const currentSession = await db.query.lessonSessions.findFirst({
      where: eq(lessonSessions.timeSlotId, slot.id),
      columns: { state: true, startedAt: true },
    });

    if (currentSession && LESSON_SESSION_ACTIVE_STATES.includes(currentSession.state as LessonSessionState)) {
      return { status: "INVALID_STATE" as const };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LESSON_START_CODE_TTL_MINUTES * 60 * 1000);

    await db
      .insert(lessonSessions)
      .values({
        timeSlotId: slot.id,
        state: "START_CODE_ISSUED",
        startCodeHash: this.hashLessonCode(code),
        startCodeIssuedAt: now,
        startCodeExpiresAt: expiresAt,
        startedAt: currentSession?.startedAt ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: lessonSessions.timeSlotId,
        set: {
          state: "START_CODE_ISSUED",
          startCodeHash: this.hashLessonCode(code),
          startCodeIssuedAt: now,
          startCodeExpiresAt: expiresAt,
          updatedAt: now,
        },
      });

    const studentProfile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, slot.studentId),
      columns: { userId: true },
    });

    if (studentProfile?.userId) {
      await NotificationsService.createForUser({
        userId: studentProfile.userId,
        type: "LESSON_START_REQUESTED",
        title: "Lesson can start now",
        body: "Your instructor requested lesson start. Open schedule and enter the code.",
        metadata: {
          timeSlotId: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        },
        localizedText: {
          bg: {
            title: "Часът може да започне",
            body: "Инструкторът изиска начало на час. Отворете графика и въведете кода.",
          },
          en: {
            title: "Lesson can start now",
            body: "Your instructor requested lesson start. Open schedule and enter the code.",
          },
        },
      });
    }

    await this.emitScheduleChanged(context.instructorProfileId, {
      kind: "LESSON_STATE_UPDATED",
      timeSlotId: slot.id,
      weekStartDate: this.getWeekStartDate(slot.startTime)?.toISOString(),
    });

    return {
      status: "SUCCESS" as const,
      verification: {
        timeSlotId: slot.id,
        code,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  static async verifyStudentLessonStartCode(actorUserId: string, timeSlotId: string, code: string) {
    const studentContext = await this.getStudentProfileContext(actorUserId);
    if (!studentContext) return { status: "NOT_FOUND" as const };

    const slot = await db.query.timeSlots.findFirst({
      where: and(
        eq(timeSlots.id, timeSlotId),
        eq(timeSlots.studentId, studentContext.studentProfileId),
      ),
      columns: { id: true, isDone: true, instructorId: true, startTime: true },
    });

    if (!slot) return { status: "LESSON_NOT_FOUND" as const };
    if (slot.isDone) return { status: "INVALID_STATE" as const };

    const session = await db.query.lessonSessions.findFirst({
      where: eq(lessonSessions.timeSlotId, slot.id),
      columns: {
        state: true,
        startCodeHash: true,
        startCodeExpiresAt: true,
      },
    });

    if (!session || session.state !== "START_CODE_ISSUED") return { status: "INVALID_STATE" as const };
    if (!session.startCodeHash || !session.startCodeExpiresAt || session.startCodeExpiresAt.getTime() < Date.now()) {
      return { status: "START_CODE_EXPIRED" as const };
    }

    const providedCodeHash = this.hashLessonCode((code || "").trim());
    if (providedCodeHash !== session.startCodeHash) return { status: "INVALID_CODE" as const };

    const now = new Date();
    await db
      .update(lessonSessions)
      .set({
        state: "ACTIVE",
        startedAt: now,
        startedByStudentAt: now,
        updatedAt: now,
      })
      .where(eq(lessonSessions.timeSlotId, slot.id));

    await this.emitScheduleChanged(slot.instructorId, {
      kind: "LESSON_STATE_UPDATED",
      timeSlotId: slot.id,
      weekStartDate: this.getWeekStartDate(slot.startTime)?.toISOString(),
    });

    return { status: "SUCCESS" as const };
  }

  static async markInstructorLessonFailed(actorUserId: string, timeSlotId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const slot = await db.query.timeSlots.findFirst({
      where: and(
        eq(timeSlots.id, timeSlotId),
        eq(timeSlots.instructorId, context.instructorProfileId),
      ),
      columns: { id: true, studentId: true, isDone: true, startTime: true },
    });

    if (!slot) return { status: "LESSON_NOT_FOUND" as const };
    if (!slot.studentId || slot.isDone) return { status: "INVALID_STATE" as const };

    const session = await db.query.lessonSessions.findFirst({
      where: eq(lessonSessions.timeSlotId, slot.id),
      columns: { state: true },
    });

    if (!session || session.state !== "ACTIVE") return { status: "INVALID_STATE" as const };

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(lessonSessions)
        .set({
          state: "FAILED",
          endedAt: now,
          updatedAt: now,
        })
        .where(eq(lessonSessions.timeSlotId, slot.id));

      await tx
        .update(timeSlots)
        .set({ isDone: true })
        .where(eq(timeSlots.id, slot.id));
    });

    await this.emitScheduleChanged(context.instructorProfileId, {
      kind: "LESSON_STATE_UPDATED",
      timeSlotId: slot.id,
      weekStartDate: this.getWeekStartDate(slot.startTime)?.toISOString(),
    });

    return { status: "SUCCESS" as const };
  }

}
