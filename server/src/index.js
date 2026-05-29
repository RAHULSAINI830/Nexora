import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { config } from "./config.js";
import { authRoutes } from "./routes/authRoutes.js";
import { accountRoutes } from "./routes/accountRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";

const app = express();

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
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/dashboard", dashboardRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation failed", issues: error.issues });
  }

  console.error(error);
  res.status(500).json({ message: "Something went wrong" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
