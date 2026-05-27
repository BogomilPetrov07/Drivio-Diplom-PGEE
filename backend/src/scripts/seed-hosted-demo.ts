import { sql, eq } from "drizzle-orm";
import { initConfig } from "../config/env.js";
import { db, initializeDb } from "../config/drizzle.js";
import { initializeRedis } from "../config/redis.js";
import { logDbConnectionString, resolveScriptDbConnectionString } from "./db-connection-log.js";
import { hash } from "../utils/password.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { instructorProfiles, schoolJoinRequests, schools, studentProfiles, users } from "../../drizzle/schemas/index.js";

const DEMO_PASSWORD = "123456!";
const DEMO_REGION = "Пловдив";

const superAdminUser = {
  id: "b658308c-f509-41ae-ba16-6a1cbb642d13",
  username: "superadmin",
  email: "bogopetrov07@gmail.com",
  password: "$argon2id$v=19$m=65536,t=3,p=4$e5cfCyxDYQOwJuGMvHYUUA$BTVDpoevGp3VvTA8Bti+7IZXXYZHEHaYQKFUPdOG0Ms",
  name: null,
  role: "SUPERADMIN" as const,
  drivingSchoolId: null,
};

const schoolFixtures = [
  {
    slug: "mitev",
    name: "Автошкола Митев",
    city: "Пловдив",
    address: "ул. Шипка 6",
    phone: "0887771443",
    rating: 5,
    source: "https://www.shofiorski-kursove.com/kontakti/",
  },
  {
    slug: "kumanovi",
    name: "Автошкола Куманов",
    city: "Пловдив",
    address: "бул. Цариградско шосе 92, ет. 2",
    phone: "0898735084",
    rating: 5,
    source: "https://avtoshkola-kumanov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
  },
  {
    slug: "karamfilov",
    name: "Автошкола Карамфилов",
    city: "Пловдив",
    address: "ж.к. Тракия, бл. 104",
    phone: "032683578",
    rating: 4,
    source: "https://www.zlatnakniga.bg/slavcho-karamfilov",
  },
  {
    slug: "ilmi",
    name: "Автошкола Илми",
    city: "Пловдив",
    address: "ул. Коматевско шосе 69А",
    phone: "0898420298",
    rating: 4,
    source: "https://www.ilmi.bg/%D0%B7%D0%B0-%D0%BD%D0%B0%D1%81/",
  },
  {
    slug: "kostadinov",
    name: "Автошкола Костадинов",
    city: "Пловдив",
    address: "ул. Борис Петров 2",
    phone: "0898211935",
    rating: 5,
    source: "https://avto6kola.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
  },
  {
    slug: "avtokonsult-2000",
    name: "Автоконсулт - 2000",
    city: "Пловдив",
    address: "бул. Цар Борис III-ти Обединител 12",
    phone: "0898744895",
    rating: 5,
    source: "https://business.bg/f-172740/avtokonsult-2000-ood.html",
  },
  {
    slug: "barbanakov",
    name: "Учебен център Барбанаков",
    city: "Пловдив",
    address: "бул. Найчо Цанов 7, ет. 1",
    phone: "0888950143",
    rating: 4,
    source: "https://barbanakov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
  },
  {
    slug: "gozmanov",
    name: "Индипендънт - Атанас Гозманов",
    city: "Пловдив",
    address: "ул. Колю Фичето 7А, Офис център Север, ет. 1, офис 8",
    phone: "0894639327",
    rating: 5,
    source: "https://www.auto-gozmanov.com/contact-us",
  },
  {
    slug: "aviosport-turist",
    name: "АВИОСПОРТ ТУРИСТ ЕООД",
    city: "Пловдив",
    address: "район Южен, ул. Студенец 1, бл. 9, вх. А, ет. 3, ап. 13",
    phone: "032767076",
    rating: 4,
    source: "https://www.infobel.com/bg/bulgaria/aviosport_turist/plovdiv/BG102043627-032767076/businessdetails.aspx",
  },
  {
    slug: "bm-90",
    name: "БМ-90 - ПЕТРОВА С-ИЕ СД",
    city: "Пловдив",
    address: "район Централен, ул. Стадион 2, ет. 1, ап. 2",
    phone: "032248409",
    rating: 4,
    source: "https://www.favzz.com/company/plovdiv/bm-90-petrova-s-ie-sd.html",
  },
] as const;

type SeedSchool = typeof schoolFixtures[number];

type RegisteredUser = {
  id: string;
  username: string;
};

async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  role: "SCHOOLADMIN" | "INSTRUCTOR" | "STUDENT";
}) {
  const created = await AuthService.register(input.username, input.password, input.role, input.email);
  return created;
}

async function updateUserDetails(userId: string, input: {
  name: string;
  drivingSchoolId: string;
}) {
  await db.update(users).set({
    name: input.name,
    drivingSchoolId: input.drivingSchoolId,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

async function createSchool(school: SeedSchool) {
  const [createdSchool] = await db.insert(schools).values({
    name: school.name,
    region: DEMO_REGION,
    city: school.city,
    address: school.address,
    phone: school.phone,
    rating: school.rating,
  }).returning();

  return createdSchool;
}

async function createSchoolAdmin(school: SeedSchool, schoolId: string) {
  const user = await registerUser({
    username: `${school.slug}.admin`,
    email: `${school.slug}.admin@drivio.demo`,
    password: DEMO_PASSWORD,
    role: "SCHOOLADMIN",
  });

  await updateUserDetails(user.id, {
    name: `${school.name} Администратор`,
    drivingSchoolId: schoolId,
  });

  return user;
}

async function createInstructor(school: SeedSchool, schoolId: string, instructorIndex: number) {
  const user = await registerUser({
    username: `${school.slug}.inst${instructorIndex + 1}`,
    email: `${school.slug}.inst${instructorIndex + 1}@drivio.demo`,
    password: DEMO_PASSWORD,
    role: "INSTRUCTOR",
  });

  await updateUserDetails(user.id, {
    name: `${school.name} Инструктор ${instructorIndex + 1}`,
    drivingSchoolId: schoolId,
  });

  const instructorProfile = await db.query.instructorProfiles.findFirst({
    where: eq(instructorProfiles.userId, user.id),
    columns: { id: true },
  });

  if (!instructorProfile) {
    throw new Error(`Instructor profile missing for ${user.username}`);
  }

  return { user, instructorProfileId: instructorProfile.id };
}

async function createStudent(input: {
  school: SeedSchool;
  schoolId: string;
  instructorProfileId: string;
  instructorIndex: number;
  studentIndex: number;
  completedHours: number;
}) {
  const user = await registerUser({
    username: `${input.school.slug}.stu${input.instructorIndex + 1}${input.studentIndex + 1}`,
    email: `${input.school.slug}.stu${input.instructorIndex + 1}${input.studentIndex + 1}@drivio.demo`,
    password: DEMO_PASSWORD,
    role: "STUDENT",
  });

  await updateUserDetails(user.id, {
    name: `${input.school.name} Курсист ${input.instructorIndex + 1}.${input.studentIndex + 1}`,
    drivingSchoolId: input.schoolId,
  });

  await db.insert(studentProfiles).values({
    userId: user.id,
    instructorId: input.instructorProfileId,
    completedHours: input.completedHours,
  });

  return user;
}

async function truncateDemoData() {
  await db.execute(sql.raw(`
    TRUNCATE TABLE
      "lesson_sessions",
      "student_schedule_replies",
      "time_slots",
      "schedule_cycles",
      "work_schedules",
      "student_lessons",
      "instructor_blockouts",
      "student_blockouts",
      "notifications",
      "push_subscriptions",
      "support_messages",
      "support_threads",
      "refresh_tokens",
      "sessions",
      "user_profile_setup_tokens",
      "student_profiles",
      "instructor_profiles",
      "cars",
      "school_join_requests",
      "users",
      "schools"
    RESTART IDENTITY CASCADE
  `));
}

async function insertSuperAdmin() {
  await db.insert(users).values(superAdminUser);
}

async function seedHostedDemo() {
  await initConfig("/backend/app");
  const connectionString = resolveScriptDbConnectionString();
  logDbConnectionString("seed:hosted-demo", connectionString);
  await initializeDb();
  await initializeRedis();

  await truncateDemoData();
  await insertSuperAdmin();

  const seededSchools: string[] = [];
  const seededUsers: RegisteredUser[] = [
    {
      id: superAdminUser.id,
      username: superAdminUser.username,
    },
  ];

  let instructorCount = 0;
  let studentCount = 0;

  for (const [schoolIndex, school] of schoolFixtures.entries()) {
    const createdSchool = await createSchool(school);
    seededSchools.push(createdSchool.id);

    const adminUser = await createSchoolAdmin(school, createdSchool.id);
    seededUsers.push({ id: adminUser.id, username: adminUser.username });

    const instructorsForSchool = schoolIndex % 2 === 0 ? 2 : 3;
    for (let instructorIndex = 0; instructorIndex < instructorsForSchool; instructorIndex += 1) {
      const instructor = await createInstructor(school, createdSchool.id, instructorIndex);
      seededUsers.push({ id: instructor.user.id, username: instructor.user.username });
      instructorCount += 1;

      const studentsForInstructor = instructorIndex % 2 === 0 ? 3 : 4;
      for (let studentIndex = 0; studentIndex < studentsForInstructor; studentIndex += 1) {
        const student = await createStudent({
          school,
          schoolId: createdSchool.id,
          instructorProfileId: instructor.instructorProfileId,
          instructorIndex,
          studentIndex,
          completedHours: Math.min(30, 4 + schoolIndex + instructorIndex + studentIndex * 2),
        });
        seededUsers.push({ id: student.id, username: student.username });
        studentCount += 1;
      }
    }
  }

  const demoPasswordHash = await hash(DEMO_PASSWORD);
  if (!demoPasswordHash) {
    throw new Error("Failed to hash demo password for verification.");
  }

  const counts = {
    schools: seededSchools.length,
    users: seededUsers.length,
    instructors: instructorCount,
    students: studentCount,
    joinRequests: await db.$count(schoolJoinRequests),
  };

  console.log("Hosted demo seed completed.");
  console.log(`Schools: ${counts.schools}`);
  console.log(`Users: ${counts.users}`);
  console.log(`Instructor profiles: ${counts.instructors}`);
  console.log(`Student profiles: ${counts.students}`);
  console.log(`Join requests left in DB: ${counts.joinRequests}`);
  console.log(`Demo password for all seeded non-superadmin accounts: ${DEMO_PASSWORD}`);
  console.log(`Example login: ${schoolFixtures[0].slug}.admin / ${DEMO_PASSWORD}`);
  console.log("School contact sources:");
  for (const school of schoolFixtures) {
    console.log(`- ${school.name}: ${school.source}`);
  }
}

seedHostedDemo().catch((error) => {
  console.error("Hosted demo seed failed:", error);
  process.exit(1);
});
