import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { env } from "../../config/env.js";
import { REDIS_KEYS } from "../../config/redis-keys.js";
import { redis } from "../../config/redis.js";
import { sendSchoolApprovalSetupEmail } from "../../utils/email.js";
import { hash } from "../../utils/password.js";
import { instructorProfiles, roleEnum, schoolJoinRequests, schools, users } from "../../../drizzle/schemas/index.js";

const SETUP_TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const SETUP_TOKEN_MAX_USES = 5;

type JoinRequestInput = {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  contactName: string;
  contactEmail: string;
};

type ApproveInput = {
  requestId: string;
  reviewerUserId: string;
};

type CompleteInput = {
  token: string;
  username: string;
  password: string;
  email: string;
  name: string;
  phone?: string;
  wantsInstructorPrivileges: boolean;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
};

type CompleteSetupResult =
  | { status: "SUCCESS"; schoolId: string; adminUserId: string }
  | { status: "INVALID_OR_EXPIRED_TOKEN" }
  | { status: "TOKEN_LIMIT_REACHED" }
  | { status: "USERNAME_TAKEN" }
  | { status: "EMAIL_TAKEN" };

export class OnboardingService {
  static async createJoinRequest(input: JoinRequestInput) {
    const [created] = await db.insert(schoolJoinRequests).values({
      schoolName: input.schoolName.trim(),
      schoolAddress: input.schoolAddress.trim(),
      schoolPhone: input.schoolPhone.trim(),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      status: "PENDING",
    }).returning();

    return created;
  }

  static async listPendingRequests() {
    return db.query.schoolJoinRequests.findMany({
      where: eq(schoolJoinRequests.status, "PENDING"),
      orderBy: [desc(schoolJoinRequests.createdAt)],
    });
  }

  static async approveRequest(input: ApproveInput) {
    const request = await db.query.schoolJoinRequests.findFirst({
      where: and(eq(schoolJoinRequests.id, input.requestId), eq(schoolJoinRequests.status, "PENDING")),
    });

    if (!request) return null;

    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = this.hashSetupToken(rawToken);
    const tokenExpiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
    const usageKey = REDIS_KEYS.ONBOARDING_SETUP_TOKEN_USES(tokenHash);

    await db.update(schoolJoinRequests)
      .set({
        status: "APPROVED",
        reviewedByUserId: input.reviewerUserId,
        approvedAt: new Date(),
        setupTokenHash: tokenHash,
        setupTokenExpiresAt: tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(schoolJoinRequests.id, input.requestId));

    await redis.set(usageKey, "0", "PX", SETUP_TOKEN_TTL_MS);

    const setupUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/register/driving-school/complete?token=${rawToken}&request=${request.id}`;
    await sendSchoolApprovalSetupEmail(request.contactEmail, request.contactName, request.schoolName, setupUrl);

    return { requestId: request.id };
  }

  static async getSetupSession(token: string) {
    const tokenHash = this.hashSetupToken(token);
    const request = await db.query.schoolJoinRequests.findFirst({
      where: and(eq(schoolJoinRequests.setupTokenHash, tokenHash), eq(schoolJoinRequests.status, "APPROVED")),
    });

    if (!request || !request.setupTokenExpiresAt || request.setupTokenExpiresAt.getTime() < Date.now()) return null;

    const usageKey = REDIS_KEYS.ONBOARDING_SETUP_TOKEN_USES(tokenHash);
    const rawUses = await redis.get(usageKey);
    const usedCount = Number(rawUses ?? "0");
    const safeUsedCount = Number.isFinite(usedCount) ? usedCount : 0;
    const remainingUses = Math.max(SETUP_TOKEN_MAX_USES - safeUsedCount, 0);

    return {
      request: {
        id: request.id,
        schoolName: request.schoolName,
        schoolAddress: request.schoolAddress,
        schoolPhone: request.schoolPhone,
        contactName: request.contactName,
        contactEmail: request.contactEmail,
      },
      token: {
        expiresAt: request.setupTokenExpiresAt.toISOString(),
        usedCount: safeUsedCount,
        remainingUses,
        maxUses: SETUP_TOKEN_MAX_USES,
      },
    };
  }

  static async completeSetup(input: CompleteInput) {
    const tokenHash = this.hashSetupToken(input.token);
    const request = await db.query.schoolJoinRequests.findFirst({
      where: and(eq(schoolJoinRequests.setupTokenHash, tokenHash), eq(schoolJoinRequests.status, "APPROVED")),
    });

    if (!request || !request.setupTokenExpiresAt || request.setupTokenExpiresAt.getTime() < Date.now()) {
      return { status: "INVALID_OR_EXPIRED_TOKEN" } as CompleteSetupResult;
    }

    const usageKey = REDIS_KEYS.ONBOARDING_SETUP_TOKEN_USES(tokenHash);
    const nextUseCount = await redis.incr(usageKey);
    if (nextUseCount === 1) {
      await redis.pexpire(usageKey, SETUP_TOKEN_TTL_MS);
    }
    if (nextUseCount > SETUP_TOKEN_MAX_USES) {
      return { status: "TOKEN_LIMIT_REACHED" } as CompleteSetupResult;
    }

    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    const existingByUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existingByUsername) return { status: "USERNAME_TAKEN" } as CompleteSetupResult;

    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existingByEmail) return { status: "EMAIL_TAKEN" } as CompleteSetupResult;

    const passwordHash = await hash(input.password);

    const created = await db.transaction(async (tx) => {
      const [newSchool] = await tx.insert(schools).values({
        name: input.schoolName.trim(),
        address: input.schoolAddress.trim(),
        phone: input.schoolPhone.trim(),
      }).returning();

      const [newAdmin] = await tx.insert(users).values({
        username,
        email,
        password: passwordHash,
        role: roleEnum.enumValues[1], // SCHOOLADMIN
        name,
        drivingSchoolId: newSchool.id,
      }).returning();

      if (input.wantsInstructorPrivileges) {
        await tx.insert(instructorProfiles).values({
          userId: newAdmin.id,
        });
      }

      await tx.update(schoolJoinRequests)
        .set({
          status: "COMPLETED",
          createdSchoolId: newSchool.id,
          createdAdminUserId: newAdmin.id,
          setupTokenHash: null,
          setupTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schoolJoinRequests.id, request.id));

      return { schoolId: newSchool.id, adminUserId: newAdmin.id };
    });

    await redis.del(usageKey);
    return { status: "SUCCESS", ...created } as CompleteSetupResult;
  }

  private static hashSetupToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
