import { env } from "../config/env.js";

export function resolveDbConnectionString() {
  const connectionString = env.DIRECT_URL || env.DATABASE_URL || env.LOCAL_DB_URL;

  if (!connectionString) {
    throw new Error("No database URL found in env (DIRECT_URL / DATABASE_URL / LOCAL_DB_URL).");
  }

  return connectionString;
}

export function logDbConnectionString(scriptName: string, connectionString: string) {
  console.log(`[${scriptName}] DB connection string: ${connectionString}`);
}
