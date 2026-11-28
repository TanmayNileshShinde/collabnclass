import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { streamRoutes } from "./routes/stream";
import { githubRoutes } from "./routes/github";
import { chatbotRoutes } from "./routes/chatbot";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "https://collabnclass.vercel.app",
  "https://collabclass.vercel.app",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/(collabclass|collabnclass)(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/stream", streamRoutes);
app.use("/api/github", githubRoutes);
app.use("/api", chatbotRoutes);

app.get("/health", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      rssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
    },
    services: {
      clerk: Boolean(process.env.CLERK_SECRET_KEY),
      stream: Boolean(
        process.env.STREAM_API_KEY &&
          (process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET)
      ),
      groq: Boolean(process.env.GROQ_API_KEY),
      github: Boolean(
        process.env.GITHUB_TOKEN ||
          process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
          (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
      ),
    },
  });
});

// Centralized JSON error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!err) {
    return next();
  }
  if (res.headersSent) {
    return next(err);
  }
  console.error("Internal Server Error:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  return res.status(status).json({
    error:
      status < 500 && err.message
        ? err.message
        : "An unexpected error occurred on the server.",
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const shutdown = (exitCode = 0) => {
  console.log("Shutting down server gracefully...");
  const forceExitTimer = setTimeout(() => {
    console.error("Forcing server exit after timeout.");
    process.exit(exitCode || 1);
  }, 5000);
  forceExitTimer.unref();

  server.close(() => {
    clearTimeout(forceExitTimer);
    console.log("Server closed.");
    process.exit(exitCode);
  });
  server.closeAllConnections?.();
};

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdown(1);
});

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
