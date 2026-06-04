import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { ZodError } from "zod";
import { config } from "./config.js";
import { initializeDatabase } from "./db.js";
import { authRoutes } from "./routes/authRoutes.js";
import { accountRoutes } from "./routes/accountRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later" }
});
app.use(apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again in 15 minutes" }
});

app.use(express.json());

app.get("/health", async (_req, res) => {
  await initializeDatabase();
  res.json({ ok: true, database: "connected" });
});

app.use("/auth/login", loginLimiter);
app.use("/auth/verify-email", loginLimiter);
app.use("/auth/resend-verification", loginLimiter);
app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/dashboard", dashboardRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues });
  }

  console.error(error);
  const errorText = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (errorText.includes("libsql") || errorText.includes("turso") || errorText.includes("database")) {
    return res.status(500).json({
      message: "Database connection failed. Check the Turso database URL and database auth token in Vercel."
    });
  }

  res.status(500).json({ message: "Something went wrong" });
});
