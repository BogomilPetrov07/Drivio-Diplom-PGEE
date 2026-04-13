import { spawn } from "node:child_process";
import { initConfig, env } from "../config/env.js";

function mapNodeEnvForDrizzle(nodeEnv: string) {
  if (nodeEnv === "prod") return "production";
  if (nodeEnv === "staging") return "staging";
  if (nodeEnv === "test") return "test";
  return "development";
}

async function runGenerate() {
  try {
    await initConfig("/backend/app", true);

    const childEnv = {
      ...process.env,
      NODE_ENV: mapNodeEnvForDrizzle(env.NODE_ENV),
      DATABASE_URL: env.DATABASE_URL ?? "",
      DIRECT_URL: env.DIRECT_URL ?? "",
      LOCAL_DB_URL: env.LOCAL_DB_URL ?? "",
    };

    console.log(`🧩 Generating Drizzle migration files for [Env: ${env.NODE_ENV}]...`);

    await new Promise<void>((resolve, reject) => {
      const child =
        process.platform === "win32"
          ? spawn("cmd.exe", ["/d", "/s", "/c", "npx drizzle-kit generate"], {
              stdio: "inherit",
              env: childEnv,
            })
          : spawn("npx", ["drizzle-kit", "generate"], {
              stdio: "inherit",
              env: childEnv,
            });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`drizzle-kit generate exited with code ${code}`));
      });
    });

    console.log("✅ Drizzle migration generation complete.");
  } catch (error) {
    console.error("❌ Migration generation failed:", error);
    process.exit(1);
  }
}

runGenerate().then(() => {
  console.log("✅ Process executed!");
});
