import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { instructorProfiles, roleEnum, schools, studentProfiles, users, workSchedules } from "../../../drizzle/schemas/index.js";
import { hash } from "../../utils/password.js";
import type {
  InstructorScheduleDays,
  InstructorSchedulePayload,
  SchoolPersonInput,
  SchoolPersonListItem,
  SchoolRole,
} from "./dashboard.types.js";

const DAY_TO_ENUM = {
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
  sunday: "SUNDAY",
} as const;

const ENUM_TO_DAY = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

const ANCHOR_DAY = {
  MONDAY: 5,
  TUESDAY: 6,
  WEDNESDAY: 7,
  THURSDAY: 8,
  FRIDAY: 9,
  SATURDAY: 10,
  SUNDAY: 11,
} as const;

export class DashboardService {
  private static toClockUtc(value: Date) {
    const hh = `${value.getUTCHours()}`.padStart(2, "0");
    const mm = `${value.getUTCMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  }

  private static toUtcAnchorDate(dayName: keyof typeof ANCHOR_DAY, time: string) {
    const [h, m] = time.split(":").map((part) => Number(part));
    return new Date(Date.UTC(1970, 0, ANCHOR_DAY[dayName], h, m, 0, 0));
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

  private static async getInstructorProfileContext(userId: string) {
    const profile = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.userId, userId),
      columns: { id: true },
    });
    return profile ? { instructorProfileId: profile.id } : null;
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
        address: true,
        phone: true,
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

  static async updateSchoolDetails(actorUserId: string, input: { name: string; address: string; phone: string }) {
    const context = await this.getSchoolAdminContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const name = input.name.trim();
    const address = input.address.trim();
    const phone = input.phone.trim();

    if (!name || !address || !phone) {
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
        address,
        phone,
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

    const username = input.username.trim();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password?.trim() ?? "";

    if (!username || !name || !email || !password) {
      return { status: "VALIDATION_ERROR" as const };
    }

    if (!["SCHOOLADMIN", "INSTRUCTOR", "STUDENT"].includes(input.role)) {
      return { status: "INVALID_ROLE" as const };
    }

    const existingByUsername = await db.query.users.findFirst({ where: eq(users.username, username), columns: { id: true } });
    if (existingByUsername) return { status: "USERNAME_TAKEN" as const };

    const existingByEmail = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
    if (existingByEmail) return { status: "EMAIL_TAKEN" as const };

    const passwordHash = await hash(password);

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

    const username = input.username.trim();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!username || !name || !email) {
      return { status: "VALIDATION_ERROR" as const };
    }

    const existingByUsername = await db.query.users.findFirst({
      where: and(eq(users.username, username), ne(users.id, targetUserId)),
      columns: { id: true },
    });
    if (existingByUsername) return { status: "USERNAME_TAKEN" as const };

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
      let nextPassword = undefined as string | undefined;
      if (input.password?.trim()) {
        nextPassword = await hash(input.password.trim());
      }

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
          username,
          email,
          name,
          role: nextRole,
          ...(nextPassword ? { password: nextPassword } : {}),
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

  static async fetchInstructorSchedule(actorUserId: string) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };

    const rows = await db.query.workSchedules.findMany({
      where: eq(workSchedules.instructorId, context.instructorProfileId),
      columns: { dayName: true, startTime: true, endTime: true },
    });

    if (rows.length === 0) return { status: "EMPTY" as const };

    const days = this.getDefaultInstructorScheduleDays();
    for (const row of rows) {
      const key = ENUM_TO_DAY[row.dayName];
      days[key] = {
        enabled: true,
        startTime: this.toClockUtc(row.startTime),
        endTime: this.toClockUtc(row.endTime),
        blockedLessonKeys: [],
      };
    }

    return { status: "SUCCESS" as const, schedule: { days } };
  }

  static async saveInstructorSchedule(actorUserId: string, input: InstructorSchedulePayload) {
    const context = await this.getInstructorProfileContext(actorUserId);
    if (!context) return { status: "NOT_FOUND" as const };
    if (!input?.days) return { status: "VALIDATION_ERROR" as const };

    const entries = Object.entries(input.days) as Array<[keyof typeof DAY_TO_ENUM, InstructorScheduleDays[keyof InstructorScheduleDays]]>;
    const enabled = entries.filter(([, value]) => value.enabled);
    if (enabled.length === 0) return { status: "VALIDATION_ERROR" as const };

    for (const [, value] of enabled) {
      if (!value.startTime || !value.endTime || value.endTime <= value.startTime) {
        return { status: "VALIDATION_ERROR" as const };
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(workSchedules).where(eq(workSchedules.instructorId, context.instructorProfileId));

      await tx.insert(workSchedules).values(
        enabled.map(([dayKey, value]) => {
          const enumDay = DAY_TO_ENUM[dayKey];
          return {
            dayName: enumDay,
            startTime: this.toUtcAnchorDate(enumDay, value.startTime),
            endTime: this.toUtcAnchorDate(enumDay, value.endTime),
            instructorId: context.instructorProfileId,
          };
        }),
      );
    });

    const refreshed = await this.fetchInstructorSchedule(actorUserId);
    if (refreshed.status !== "SUCCESS") return { status: "SUCCESS" as const, schedule: { days: this.getDefaultInstructorScheduleDays() } };
    return { status: "SUCCESS" as const, schedule: refreshed.schedule };
  }
}
