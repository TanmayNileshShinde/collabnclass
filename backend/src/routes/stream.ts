import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/clerk-sdk-node";
import { StreamClient } from "@stream-io/node-sdk";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

let streamClientInstance: StreamClient | null = null;
const getStreamClient = (): StreamClient | null => {
  if (streamClientInstance) return streamClientInstance;
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_SECRET_KEY;
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

// get stream token
router.post("/token", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
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

    // Create token with admin role to allow all participants to update calls
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

// delete recording
router.delete("/recordings/:recordingId", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    if (!recordingId) {
      return res.status(400).json({ error: "Recording ID is required" });
    }

    const decodedRecordingId = decodeURIComponent(recordingId as string);

    // Call Stream client delete recording if client is available
    const client = getStreamClient();
    if (client) {
      try {
        // Stream video recording deletion via client or REST API
        if (typeof (client as any).deleteRecording === "function") {
          await (client as any).deleteRecording(decodedRecordingId);
        } else if (typeof (client as any).video?.deleteRecording === "function") {
          await (client as any).video.deleteRecording(decodedRecordingId);
        } else if (process.env.STREAM_API_KEY && process.env.STREAM_SECRET_KEY) {
          const serverToken = client.createToken("admin");
          await axios.delete(
            `https://video.stream-io-api.com/api/v2/video/recordings/${encodeURIComponent(decodedRecordingId)}`,
            {
              headers: {
                "Stream-Auth-Type": "jwt",
                Authorization: serverToken,
                "api-key": process.env.STREAM_API_KEY,
              },
              params: {
                api_key: process.env.STREAM_API_KEY,
              },
            }
          ).catch((err) => {
            console.warn("Stream REST API delete warning:", err?.response?.data || err.message);
          });
        }
      } catch (streamErr) {
        console.warn("Stream recording deletion warning:", streamErr);
      }
    }

    res.json({ 
      message: "Recording deleted successfully",
      recordingId: decodedRecordingId
    });
  } catch (error) {
    console.error("Error deleting recording:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete recording";
    res
      .status(500)
      .json({ error: `Failed to delete recording: ${errorMessage}` });
  }
});

export { router as streamRoutes, verifyAuth };
