import dotenv from "dotenv";

dotenv.config();

function envValue(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined) return fallback;

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const deploymentOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ""
].filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: envValue("JWT_SECRET", "dev-only-secret-change-me"),
  clientOrigins: envValue("CLIENT_ORIGINS", envValue("CLIENT_ORIGIN", "http://localhost:5173,http://localhost:5174"))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat(deploymentOrigins),
  databaseFile: envValue("DATABASE_FILE", process.env.VERCEL ? "/tmp/cortexy.db" : "./data/cortexy.db"),
  tursoDatabaseUrl: envValue("TURSO_DATABASE_URL"),
  tursoAuthToken: envValue("TURSO_AUTH_TOKEN"),
  externalApiUrl: envValue("EXTERNAL_API_URL"),
  externalApiKey: envValue("EXTERNAL_API_KEY"),
  resendApiKey: envValue("RESEND_API_KEY"),
  emailFrom: envValue("EMAIL_FROM", "Nexora <onboarding@resend.dev>"),
  bootstrapDeveloperEmail: envValue("BOOTSTRAP_DEVELOPER_EMAIL"),
  bootstrapDeveloperPassword: envValue("BOOTSTRAP_DEVELOPER_PASSWORD")
};
