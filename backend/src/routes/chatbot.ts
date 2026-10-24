import { Request, Response } from "express";
import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";
import { verifyToken } from "@clerk/clerk-sdk-node";

dotenv.config();

const router = express.Router();

let groqClient: Groq | null = null;
const getGroqClient = (): Groq | null => {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) return null;
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  return groqClient;
};

// In-memory sliding window rate limiter: 20 requests per minute per identifier
const requestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

const checkRateLimit = (key: string): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const timestamps = (requestTimestamps.get(key) || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  requestTimestamps.set(key, timestamps);
  return { allowed: true };
};

// Chat endpoint with authentication & rate limiting
router.post("/chatbot", async (req: Request, res: Response) => {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (clerkSecretKey && token) {
        try {
          const decoded = await verifyToken(token, { secretKey: clerkSecretKey });
          if (decoded && decoded.sub) {
            userId = decoded.sub;
          }
        } catch (authErr) {
          return res.status(401).json({
            error: "Invalid or expired authorization token. Please sign in again.",
          });
        }
      }
    } else if (clerkSecretKey) {
      // If CLERK_SECRET_KEY is configured on server, require auth
      return res.status(401).json({
        error: "Authentication required to use AI Study Assistant.",
      });
    }

    // Rate limit by verified userId or client IP
    const rateLimitKey = userId || req.ip || req.socket.remoteAddress || "anonymous";
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      res.setHeader("Retry-After", String(rateCheck.retryAfter || 60));
      return res.status(429).json({
        error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds before sending another message.`,
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res
        .status(400)
        .json({ error: "A valid 'message' string is required." });
    }

    const groq = getGroqClient();
    if (!groq) {
      return res.status(503).json({
        error: "AI Chatbot is currently unavailable. Set GROQ_API_KEY in backend .env to enable.",
      });
    }

    // Build conversation context for Groq
    let contextMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    // Add conversation history (last 5 messages)
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      contextMessages = conversationHistory.slice(-5).map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content || ""),
      }));
    }
    contextMessages.push({
      role: "user",
      content: message.trim(),
    });

    const systemPrompt = `You are a helpful AI assistant for video meetings. You help users with:
    - Meeting management and scheduling
    - Technical troubleshooting
    - Meeting etiquette and best practices
    - Note-taking and action items
    - General meeting assistance

    Be concise, friendly, and helpful. Keep responses under 150 words when possible.`;

    // Call Groq API with valid versatile model
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...contextMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I'm here to help with your meeting! What would you like to know?";

    res.json({ response });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "Failed to process message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as chatbotRoutes };
