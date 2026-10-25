import { Router } from "express";
import { verifyToken } from "@clerk/clerk-sdk-node";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// In-memory cache for GitHub API requests to protect against unauthenticated 60 req/hr rate limits
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL
const githubCache = new Map<string, CacheEntry>();

const getCached = (key: string): any | null => {
  const entry = githubCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    githubCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key: string, data: any): void => {
  if (githubCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of githubCache.entries()) {
      if (now > v.expiresAt) githubCache.delete(k);
    }
  }
  githubCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

// Get GitHub token from environment (optional but recommended for higher rate limits)
const getGitHubToken = () => {
  return (
    process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ""
  );
};

// Log token status on startup (without exposing the actual token)
const GITHUB_TOKEN = getGitHubToken();
if (GITHUB_TOKEN) {
  console.log(
    "✅ GitHub token is configured. Authenticated requests will be used.",
  );
} else {
  console.warn(
    "⚠️  GitHub token not found. Using unauthenticated requests with in-memory caching. Set GITHUB_TOKEN in environment variables for 5,000 req/hr.",
  );
}

// Format error handling with 403 rate limit detection
const handleGitHubError = (res: any, error: any, defaultMsg: string) => {
  console.error(defaultMsg, error);
  const statusCode = error.response?.status || 500;
  const isRateLimit =
    statusCode === 403 &&
    (error.response?.headers?.["x-ratelimit-remaining"] === "0" ||
      (typeof error.response?.data?.message === "string" &&
        error.response.data.message.toLowerCase().includes("rate limit")));

  const errorMessage = isRateLimit
    ? "GitHub API rate limit exceeded (60 requests/hr unauthenticated limit). Cached entries will continue to serve. Please wait a few moments or configure GITHUB_TOKEN in backend environment variables."
    : error.response?.data?.message || error.message || defaultMsg;

  res.status(statusCode).json({
    error: errorMessage,
    isRateLimit,
    retryAfter: error.response?.headers?.["x-ratelimit-reset"],
    details: error.response?.data || error.message,
  });
};

// middleware to verify clerk auth
const verifyAuth = async (req: any, res: any, next: any) => {
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
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: "Invalid token: missing user ID" });
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    return res
      .status(401)
      .json({ error: `Authentication failed: ${errorMessage}` });
  }
};

// Get repository contents (with wildcard path)
router.get(
  "/repo/:owner/:repo/contents/*",
  verifyAuth,
  async (req: any, res: any) => {
    try {
      const { owner, repo } = req.params;
      const path = req.params[0] || ""; // Get the rest of the path
      const cacheKey = `contents:${owner}:${repo}:${path}`;

      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CollabClass-App",
      };

      const githubToken = getGitHubToken();
      if (githubToken) {
        headers["Authorization"] = `Bearer ${githubToken}`;
      }

      const response = await axios.get(githubApiUrl, { headers });
      setCache(cacheKey, response.data);
      res.json(response.data);
    } catch (error: any) {
      handleGitHubError(res, error, "Failed to fetch repository contents");
    }
  },
);

// Get repository root contents
router.get("/repo/:owner/:repo/contents", verifyAuth, async (req: any, res: any) => {
  try {
    const { owner, repo } = req.params;
    const cacheKey = `contents:${owner}:${repo}:root`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CollabClass-App",
    };

    const githubToken = getGitHubToken();
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    const response = await axios.get(githubApiUrl, { headers });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error: any) {
    handleGitHubError(res, error, "Failed to fetch repository root contents");
  }
});

// Get repository information (this must come after the contents route)
router.get("/repo/:owner/:repo", verifyAuth, async (req: any, res: any) => {
  try {
    const { owner, repo } = req.params;
    const cacheKey = `info:${owner}:${repo}`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CollabClass-App",
    };

    const githubToken = getGitHubToken();
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    const response = await axios.get(githubApiUrl, { headers });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error: any) {
    handleGitHubError(res, error, "Failed to fetch repository information");
  }
});

export { router as githubRoutes };
