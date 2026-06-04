import dotenv from "dotenv";

dotenv.config();

const deploymentOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ""
].filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  clientOrigins: (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat(deploymentOrigins),
  databaseFile: process.env.DATABASE_FILE ?? (process.env.VERCEL ? "/tmp/cortexy.db" : "./data/cortexy.db"),
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL ?? "",
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? "",
  externalApiUrl: process.env.EXTERNAL_API_URL ?? "",
  externalApiKey: process.env.EXTERNAL_API_KEY ?? "",
  bootstrapDeveloperEmail: process.env.BOOTSTRAP_DEVELOPER_EMAIL ?? "",
  bootstrapDeveloperPassword: process.env.BOOTSTRAP_DEVELOPER_PASSWORD ?? ""
};
