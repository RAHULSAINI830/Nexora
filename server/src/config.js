import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  clientOrigins: (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseFile: process.env.DATABASE_FILE ?? "./data/cortexy.db",
  externalApiUrl: process.env.EXTERNAL_API_URL ?? "",
  externalApiKey: process.env.EXTERNAL_API_KEY ?? ""
};
