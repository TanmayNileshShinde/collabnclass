import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { streamRoutes } from "./routes/stream";
import { githubRoutes } from "./routes/github";
import { chatbotRoutes } from "./routes/chatbot";

dotenv.config();

const app = express();
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
        /^https:\/\/(collabclass|collabnclass).*\.vercel\.app$/.test(origin) ||
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
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  });
});

// Centralized JSON error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("Internal Server Error:", err);
    return res.status(err.status || 500).json({
      error: err.message || "An unexpected error occurred on the server.",
    });
  }
  next();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const shutdown = () => {
  console.log("Shutting down server gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
