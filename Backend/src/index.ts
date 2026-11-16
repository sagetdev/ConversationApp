
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.use("/api/v1/health", healthRoutes);

app.listen(env.PORT, () => {
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
