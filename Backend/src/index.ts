import http from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env, allowedOrigins } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import healthRoutes from "./routes/health.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import audioRoutes from "./routes/audio.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { attachLiveGateway } from "./websocket/live.gateway.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: false
}));
app.use(express.json({ limit: "64kb" }));
app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 90,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.get("/", (_req, res) => res.status(200).json({
  service: "ConversationApp API",
  version: "1.0.0",
  docs: "/api/v1/health"
}));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/audio", audioRoutes);
app.use((_req, res) => res.status(404).json({
  success: false,
  error: { code: "NOT_FOUND", message: "Route not found." }
}));
app.use(errorMiddleware);

const server = http.createServer(app);
attachLiveGateway(server);
server.listen(env.PORT, () => {
  console.log("ConversationApp API listening on port " + env.PORT);
  console.log("Environment: " + env.NODE_ENV);
});

async function shutdown(signal: string): Promise<void> {
  console.log(signal + " received. Shutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
