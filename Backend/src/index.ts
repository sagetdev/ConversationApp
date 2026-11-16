import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import translationRoutes from "./routes/translation.routes.js";
import speechRoutes from "./routes/speech.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, service: "ConversationApp API" });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/conversation", conversationRoutes);
app.use("/api/v1/translation", translationRoutes);
app.use("/api/v1/speech", speechRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("Request error:", error);

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ success: false, error: "Malformed JSON body." });
    return;
  }

  if (error instanceof Error && error.message === "Origin is not allowed by CORS.") {
    res.status(403).json({ success: false, error: "Origin is not allowed." });
    return;
  }

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === "production"
      ? "An unexpected server error occurred."
      : error instanceof Error ? error.message : "Unknown server error.",
  });
};

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`ConversationApp API running in ${env.NODE_ENV} on port ${env.PORT}`);
});
