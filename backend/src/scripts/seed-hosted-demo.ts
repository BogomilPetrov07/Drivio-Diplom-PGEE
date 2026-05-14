import { eq, inArray } from "drizzle-orm";
import { instructorProfiles, schools, studentProfiles, users } from "../../drizzle/schemas/index.js";
import { initConfig } from "../config/env.js";
import { db, initializeDb } from "../config/drizzle.js";
import { logDbConnectionString, resolveScriptDbConnectionString } from "./db-connection-log.js";

const demoSchool = {
  id: "4406c133-8e08-4d15-b645-dace90664e08",
  name: "Тестова автошкола",
  address: "Тестови адрес",
  phone: "0111222333444",
  createdAt: new Date("2026-04-24T15:56:10.022647Z"),
  updatedAt: new Date("2026-04-24T15:56:10.022647Z"),
};

const demoUsers = [
  {
    id: "0926a32e-29d6-41a0-8890-b0f76576b248",
    username: "schooladmin",
    email: "bogomilpetrov21a@gmail.com",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$OhJ1GanAM13L6wrzbDzdDg$IUoVvxZ6a5Rg5HOrce8fHwOG7+pWGtHXXR70r3f5/tE",
    name: "Тестови администратор",
    role: "SCHOOLADMIN" as const,
    drivingSchoolId: demoSchool.id,
    createdAt: new Date("2026-04-24T15:56:10.022647Z"),
    updatedAt: new Date("2026-04-24T15:56:10.022647Z"),
  },
  {
    id: "66058fbb-f0dd-4fec-9302-1b5b4ab670bc",
    username: "student",
    email: "drivio.platform@gmail.com",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$OhAys91Bz5e3FOo2CFb8Zw$E1VLBDeB5TE8mX2Ff/By09Uca/Tk1qtSTjUv2ySG+QY",
    name: "Тестови курсист",
    role: "STUDENT" as const,
    drivingSchoolId: demoSchool.id,
    createdAt: new Date("2026-04-24T15:57:52.827275Z"),
    updatedAt: new Date("2026-04-24T13:00:50.852Z"),
  },
  {
    id: "b658308c-f509-41ae-ba16-6a1cbb642d13",
    username: "superadmin",
    email: "bogopetrov07@gmail.com",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$e5cfCyxDYQOwJuGMvHYUUA$BTVDpoevGp3VvTA8Bti+7IZXXYZHEHaYQKFUPdOG0Ms",
    name: null,
    role: "SUPERADMIN" as const,
    drivingSchoolId: null,
    createdAt: new Date("2026-04-24T15:52:18.108759Z"),
    updatedAt: new Date("2026-04-24T15:52:18.108759Z"),
  },
  {
    id: "ff52aaf1-1528-4898-b0b8-370a19fa68f3",
    username: "instructor",
    email: "bds.petrov@gmail.com",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$RdKFZkQaJ/EWKNhUCqTosg$NSUXuvj1aITpWlXJT+loa1JmsCjY62x1Dr7Q78+g9Kk",
    name: "Тестови инструктор",
    role: "INSTRUCTOR" as const,
    drivingSchoolId: demoSchool.id,
    createdAt: new Date("2026-04-24T15:57:21.309872Z"),
    updatedAt: new Date("2026-04-24T12:59:23.379Z"),
  },
];

const demoInstructorProfiles = [
  {
    id: "87740251-1557-4fa4-ae01-3a9bbd4ec0ee",
    userId: "ff52aaf1-1528-4898-b0b8-370a19fa68f3",
  },
];

const demoStudentProfiles = [
  {
    id: "daa3f95c-6c73-41b4-94b3-63883bae8600",
    userId: "66058fbb-f0dd-4fec-9302-1b5b4ab670bc",
    completedHours: 0,
    instructorId: "87740251-1557-4fa4-ae01-3a9bbd4ec0ee",
  },
];

async function seedHostedDemo() {
  await initConfig("/backend/app");
  const connectionString = resolveScriptDbConnectionString();
  logDbConnectionString("seed:hosted-demo", connectionString);
  await initializeDb();

  await db.transaction(async (tx) => {
    await tx.delete(studentProfiles).where(inArray(studentProfiles.id, demoStudentProfiles.map((profile) => profile.id)));
    await tx
      .delete(instructorProfiles)
      .where(inArray(instructorProfiles.id, demoInstructorProfiles.map((profile) => profile.id)));
    await tx.delete(users).where(inArray(users.id, demoUsers.map((user) => user.id)));
    await tx.delete(schools).where(eq(schools.id, demoSchool.id));

    await tx.insert(schools).values(demoSchool);
    await tx.insert(users).values(demoUsers);
    await tx.insert(instructorProfiles).values(demoInstructorProfiles);
    await tx.insert(studentProfiles).values(demoStudentProfiles);
  });

  console.log("Hosted demo seed completed.");
}

seedHostedDemo().catch((error) => {
  console.error("Hosted demo seed failed:", error);
  process.exit(1);
});
