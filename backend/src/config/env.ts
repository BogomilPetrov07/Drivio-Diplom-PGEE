import "dotenv/config";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing env variable: ${name}`);
    return value;
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: Number(process.env.PORT ?? 3000),
    DATABASE_URL: requireEnv("DATABASE_URL"),
    DIRECT_URL: requireEnv("DIRECT_URL"),
    JWT_PRIVATE_KEY: requireEnv("JWT_PRIVATE_KEY")
        .replace(/\\n/g, '\n') // Handle literal \n strings
        .split('\n')           // Split into lines
        .map(line => line.trim()) // Trim spaces from each line
        .join('\n'),           // Rejoin with clean newlines

    JWT_PUBLIC_KEY: requireEnv("JWT_PUBLIC_KEY")
        .replace(/\\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .join('\n'),
    FRONTEND_URL: requireEnv("FRONTEND_URL"),
    SMTP_HOST: requireEnv("SMTP_HOST"),
    SMTP_PORT: Number(requireEnv("SMTP_PORT")),
    SMTP_USER: requireEnv("SMTP_USER"),
    SMTP_PASS: requireEnv("SMTP_PASS"),
    EMAIL_FROM: requireEnv("EMAIL_FROM"),
};
