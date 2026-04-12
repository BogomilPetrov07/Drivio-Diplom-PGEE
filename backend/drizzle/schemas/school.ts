import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cars = pgTable("cars", {
    id: uuid("id").primaryKey().defaultRandom(),
    licensePlate: text("license_plate").notNull(),
    isAvailable: boolean("is_available").notNull(),
    ptiExpireDate: timestamp("pti_expire_date").notNull(),
    vignetteExpireDate: timestamp("vignette_expire_date").notNull(),
    schoolId: uuid("school_id").notNull().references(() => schools.id),
});

export const schoolJoinRequests = pgTable("school_join_requests", {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolName: text("school_name").notNull(),
    schoolAddress: text("school_address").notNull(),
    schoolPhone: text("school_phone").notNull(),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | COMPLETED
    reviewedByUserId: uuid("reviewed_by_user_id"),
    approvedAt: timestamp("approved_at"),
    setupTokenHash: text("setup_token_hash"),
    setupTokenExpiresAt: timestamp("setup_token_expires_at"),
    createdSchoolId: uuid("created_school_id").references(() => schools.id),
    createdAdminUserId: uuid("created_admin_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
