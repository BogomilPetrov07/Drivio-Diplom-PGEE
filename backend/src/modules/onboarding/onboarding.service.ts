import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { env } from "../../config/env.js";
import { sendSchoolApprovalSetupEmail } from "../../utils/email.js";
import { hash } from "../../utils/password.js";
import { roleEnum, schoolJoinRequests, schools, users } from "../../../drizzle/schemas/index.js";

const SETUP_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

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
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
};

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

    const setupUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/register/driving-school/complete?token=${rawToken}&request=${request.id}`;
    await sendSchoolApprovalSetupEmail(request.contactEmail, request.contactName, request.schoolName, setupUrl);

    return { requestId: request.id };
  }

  static async completeSetup(input: CompleteInput) {
    const tokenHash = this.hashSetupToken(input.token);
    const request = await db.query.schoolJoinRequests.findFirst({
      where: and(eq(schoolJoinRequests.setupTokenHash, tokenHash), eq(schoolJoinRequests.status, "APPROVED")),
    });

    if (!request || !request.setupTokenExpiresAt || request.setupTokenExpiresAt.getTime() < Date.now()) return null;

    const passwordHash = await hash(input.password);

    return db.transaction(async (tx) => {
      const [newSchool] = await tx.insert(schools).values({
        name: input.schoolName.trim(),
        address: input.schoolAddress.trim(),
        phone: input.schoolPhone.trim(),
      }).returning();

      const [newAdmin] = await tx.insert(users).values({
        username: input.username.trim(),
        email: request.contactEmail,
        password: passwordHash,
        role: roleEnum.enumValues[1], // SCHOOLADMIN
        name: request.contactName,
        drivingSchoolId: newSchool.id,
      }).returning();

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
  }

  private static hashSetupToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
