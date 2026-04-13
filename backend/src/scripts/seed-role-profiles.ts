import { initConfig } from "../config/env.js";
import { initializeDb } from "../config/drizzle.js";
import { initializeRedis } from "../config/redis.js";

type SeedUser = {
  username: string;
  email: string;
  password: string;
  role: "SUPERADMIN" | "SCHOOLADMIN" | "INSTRUCTOR" | "STUDENT";
};

const seedUsers: SeedUser[] = [
  {
    username: "superadmin_bogo",
    email: "bogopetrov07@gmail.com",
    password: "SAdmin",
    role: "SUPERADMIN",
  },
  {
    username: "schooladmin_bogo",
    email: "bogomilpetrov21a@gmail.com",
    password: "SchAdmin",
    role: "SCHOOLADMIN",
  },
  {
    username: "instructor_bogo",
    email: "bds.petrov@gmail.com",
    password: "Inst",
    role: "INSTRUCTOR",
  },
  {
    username: "student_bogo",
    email: "drivio.platform@gmail.com",
    password: "Bogo123",
    role: "STUDENT",
  },
];

async function seed() {
  await initConfig("/backend/app");
  await initializeDb();
  await initializeRedis();

  const { default: app } = await import("../app.js");
  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve server address");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    for (const user of seedUsers) {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (response.status === 201) {
        console.log(`Created: ${user.role} (${user.email})`);
        continue;
      }

      if (response.status === 409) {
        console.log(`Exists: ${user.role} (${user.email})`);
        continue;
      }

      const body = await response.text();
      throw new Error(`Register failed for ${user.email}. Status: ${response.status}. Body: ${body}`);
    }

    console.log("Seed completed.");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

seed().catch((error) => {
  console.error("Role profile seeding failed:", error);
  process.exit(1);
});
