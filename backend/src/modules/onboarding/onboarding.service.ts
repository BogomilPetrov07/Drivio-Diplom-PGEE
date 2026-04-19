import crypto from "crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { REDIS_KEYS } from "../../config/redis-keys.js";
import { redis } from "../../config/redis.js";
import { sendSchoolApprovalSetupEmail } from "../../utils/email.js";
import { hash } from "../../utils/password.js";
import { getPreferredFrontendUrl } from "../../utils/frontend-url.js";
import { instructorProfiles, roleEnum, schoolJoinRequests, schools, userProfileSetupTokens, users } from "../../../drizzle/schemas/index.js";

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

type UserProfileSetupSessionResult =
  | {
    status: "SUCCESS";
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      schoolName: string;
    };
    token: {
      expiresAt: string;
      usedCount: number;
      remainingUses: number;
      maxUses: number;
    };
  }
  | { status: "INVALID_OR_EXPIRED_TOKEN" }
  | { status: "TOKEN_LIMIT_REACHED" };

type CompleteUserProfileInput = {
  token: string;
  username: string;
  password: string;
  email: string;
  name: string;
};

type CompleteUserProfileResult =
  | { status: "SUCCESS"; userId: string }
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

    const usageKey = REDIS_KEYS.ONBOARDING_SETUP_TOKEN_USES(tokenHash);
    await redis.set(usageKey, "0", "PX", SETUP_TOKEN_TTL_MS);

    const setupUrl = `${getPreferredFrontendUrl()}/register/driving-school/complete?token=${rawToken}&request=${request.id}`;
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

  static async createUserProfileSetupToken(input: {
    userId: string;
    email: string;
  }) {
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = this.hashSetupToken(rawToken);
    const expiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS);

    await db.delete(userProfileSetupTokens).where(eq(userProfileSetupTokens.userId, input.userId));
    await db.insert(userProfileSetupTokens).values({
      userId: input.userId,
      tokenHash,
      expiresAt,
      usedCount: 0,
      maxUses: SETUP_TOKEN_MAX_USES,
    });

    return { rawToken, expiresAt };
  }

  static async getUserProfileSetupSession(token: string): Promise<UserProfileSetupSessionResult> {
    const tokenHash = this.hashSetupToken(token);
    const tokenRow = await db.query.userProfileSetupTokens.findFirst({
      where: eq(userProfileSetupTokens.tokenHash, tokenHash),
      with: {
        user: {
          columns: { id: true, name: true, email: true, role: true, drivingSchoolId: true },
        },
      },
    });

    if (!tokenRow || tokenRow.consumedAt || tokenRow.expiresAt.getTime() < Date.now()) {
      return { status: "INVALID_OR_EXPIRED_TOKEN" };
    }

    if (tokenRow.usedCount >= tokenRow.maxUses) {
      return { status: "TOKEN_LIMIT_REACHED" };
    }

    const school = tokenRow.user.drivingSchoolId
      ? await db.query.schools.findFirst({
        where: eq(schools.id, tokenRow.user.drivingSchoolId),
        columns: { name: true },
      })
      : null;

    return {
      status: "SUCCESS",
      user: {
        id: tokenRow.user.id,
        name: tokenRow.user.name ?? "",
        email: tokenRow.user.email ?? "",
        role: tokenRow.user.role,
        schoolName: school?.name ?? "",
      },
      token: {
        expiresAt: tokenRow.expiresAt.toISOString(),
        usedCount: tokenRow.usedCount,
        remainingUses: Math.max(tokenRow.maxUses - tokenRow.usedCount, 0),
        maxUses: tokenRow.maxUses,
      },
    };
  }

  static async completeUserProfileSetup(input: CompleteUserProfileInput): Promise<CompleteUserProfileResult> {
    const tokenHash = this.hashSetupToken(input.token);
    const tokenRow = await db.query.userProfileSetupTokens.findFirst({
      where: eq(userProfileSetupTokens.tokenHash, tokenHash),
      columns: {
        id: true,
        userId: true,
        usedCount: true,
        maxUses: true,
        expiresAt: true,
        consumedAt: true,
      },
    });

    if (!tokenRow || tokenRow.consumedAt || tokenRow.expiresAt.getTime() < Date.now()) {
      return { status: "INVALID_OR_EXPIRED_TOKEN" };
    }

    const nextUseCount = tokenRow.usedCount + 1;
    await db.update(userProfileSetupTokens).set({
      usedCount: nextUseCount,
      updatedAt: new Date(),
    }).where(eq(userProfileSetupTokens.id, tokenRow.id));

    if (nextUseCount > tokenRow.maxUses) {
      return { status: "TOKEN_LIMIT_REACHED" };
    }

    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    const existingByUsername = await db.query.users.findFirst({
      where: and(eq(users.username, username), ne(users.id, tokenRow.userId)),
      columns: { id: true },
    });
    if (existingByUsername) return { status: "USERNAME_TAKEN" };

    const existingByEmail = await db.query.users.findFirst({
      where: and(eq(users.email, email), ne(users.id, tokenRow.userId)),
      columns: { id: true },
    });
    if (existingByEmail) return { status: "EMAIL_TAKEN" };

    const passwordHash = await hash(input.password.trim());
    await db.transaction(async (tx) => {
      await tx.update(users).set({
        username,
        email,
        name,
        password: passwordHash,
        updatedAt: new Date(),
      }).where(eq(users.id, tokenRow.userId));

      await tx.update(userProfileSetupTokens).set({
        consumedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(userProfileSetupTokens.id, tokenRow.id));
    });

    return { status: "SUCCESS", userId: tokenRow.userId };
  }

  private static hashSetupToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
