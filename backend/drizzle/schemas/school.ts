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