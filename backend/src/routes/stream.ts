import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/clerk-sdk-node";
import { StreamClient } from "@stream-io/node-sdk";
import crypto from "crypto";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

let streamClientInstance: StreamClient | null = null;
const getStreamClient = (): StreamClient | null => {
  if (streamClientInstance) return streamClientInstance;
  const rawApiKey = process.env.STREAM_API_KEY;
  const rawApiSecret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET;
  if (!rawApiKey || !rawApiSecret) return null;
  const apiKey = rawApiKey.trim();
  const apiSecret = rawApiSecret.trim();
  if (!apiKey || !apiSecret) return null;
  streamClientInstance = new StreamClient(apiKey, apiSecret);
  return streamClientInstance;
};

// middleware to verify clerk auth
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    if (!token) {
      return res.status(401).json({ error: "Token is missing" });
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return res.status(503).json({
        error: "CLERK_SECRET_KEY is missing on the server. Please set it in backend .env",
      });
    }

    const decoded = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: "Invalid token: missing user ID" });
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    return res
      .status(401)
      .json({ error: `Authentication failed: ${errorMessage}` });
  }
};

// Fallback STUN/TURN servers for restricted networks (Issue #2)
router.get("/ice-servers", async (req: Request, res: Response) => {
  try {
    const defaultStunServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ];

    const customTurnUrl = process.env.CUSTOM_TURN_URL;
    const customTurnUsername = process.env.CUSTOM_TURN_USERNAME;
    const customTurnCredential = process.env.CUSTOM_TURN_CREDENTIAL;

    const iceServers: Array<{ urls: string; username?: string; credential?: string }> = [
      ...defaultStunServers,
    ];
    if (customTurnUrl && customTurnUsername && customTurnCredential) {
      iceServers.push({
        urls: customTurnUrl,
        username: customTurnUsername,
        credential: customTurnCredential,
      });
    }

    res.json({
      iceServers,
      fallbackEnabled: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error retrieving ICE servers:", error);
    res.status(500).json({ error: "Failed to load ICE servers" });
  }
});

// get stream token
router.post("/token", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    const client = getStreamClient();
    if (!client) {
      return res.status(503).json({
        error:
          "Stream API credentials are missing on the server. Set STREAM_API_KEY and STREAM_SECRET_KEY in backend .env",
      });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    // admin token
    const token = client.createToken(userId, expirationTime, issuedAt);

    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate token";
    res
      .status(500)
      .json({ error: `Failed to generate token: ${errorMessage}` });
  }
});

function createStreamServerJwt(apiSecret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ server: true, iat: now, exp: now + 300 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

// delete recording
router.delete("/recordings/:recordingId", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    const userId = req.userId;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    if (!recordingId || typeof recordingId !== "string" || !recordingId.trim()) {
      return res.status(400).json({ error: "Recording ID is required" });
    }

    const client = getStreamClient();
    const apiKey = process.env.STREAM_API_KEY?.trim();
    const apiSecret = (process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET)?.trim();
    if (!client || !apiKey || !apiSecret) {
      return res.status(503).json({
        error: "Stream API credentials are not configured on the server.",
      });
    }

    let decodedRecordingId = String(recordingId).trim();
    try {
      decodedRecordingId = decodeURIComponent(decodedRecordingId);
    } catch {
      decodedRecordingId = String(recordingId).trim();
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const query = req.query as Record<string, unknown>;
    const callType = String(body.callType || query.callType || "default").trim();
    const callId = String(body.callId || query.callId || "").trim();
    const sessionId = String(body.sessionId || query.sessionId || "").trim();
    const filename = String(body.filename || query.filename || decodedRecordingId).trim();

    if (!callId || !sessionId || !filename) {
      return res.status(400).json({
        error: "callId, sessionId, and filename are required to delete a Stream recording.",
      });
    }

    // Verify caller owns or created the target call before deleting its recording
    const callResp = await client.video.call(callType, callId).get();
    const callData = callResp?.call;
    const creatorId = callData?.created_by?.id;
    const customCreatorId = (callData?.custom as Record<string, unknown> | undefined)?.creatorId;
    if (creatorId !== userId && customCreatorId !== userId) {
      return res.status(403).json({
        error: "Only the classroom host can delete recordings for this session.",
      });
    }

    const serverToken = createStreamServerJwt(apiSecret);
    await axios.delete(
      `https://video.stream-io-api.com/api/v2/video/call/${encodeURIComponent(callType)}/${encodeURIComponent(callId)}/${encodeURIComponent(sessionId)}/recordings/${encodeURIComponent(filename)}`,
      {
        headers: {
          "Stream-Auth-Type": "jwt",
          Authorization: serverToken,
          "api-key": apiKey,
        },
        params: {
          api_key: apiKey,
        },
        timeout: 10000,
      }
    );

    res.json({
      message: "Recording deleted successfully",
      recordingId: filename,
    });
  } catch (error) {
    console.error("Error deleting recording:", error);
    const axiosErr = error as AxiosError<{ message?: string }>;
    const upstreamStatus = axiosErr?.response?.status;
    if (upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 500) {
      return res.status(upstreamStatus).json({
        error: axiosErr.response?.data?.message || "Recording deletion rejected by Stream API",
      });
    }
    const errorMessage =
      axiosErr?.response?.data?.message ||
      (error instanceof Error ? error.message : "Failed to delete recording");
    res
      .status(upstreamStatus && upstreamStatus >= 500 ? 502 : 500)
      .json({ error: `Failed to delete recording: ${errorMessage}` });
  }
});

export { router as streamRoutes, verifyAuth };
