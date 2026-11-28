import { Router, Request, Response } from "express";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import { verifyAuth } from "./stream";

dotenv.config();

const router = Router();

// api cache
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL
const githubCache = new Map<string, CacheEntry>();

const getCached = (key: string): unknown | null => {
  const entry = githubCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    githubCache.delete(key);
    return null;
  }
  return entry.data;
};

const MAX_CACHE_ENTRIES = 1000;

const setCache = (key: string, data: unknown): void => {
  if (githubCache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of githubCache.entries()) {
      if (now > v.expiresAt) githubCache.delete(k);
    }
    while (githubCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = githubCache.keys().next().value;
      if (oldestKey === undefined) break;
      githubCache.delete(oldestKey);
    }
  }
  githubCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

// github token
const getGitHubToken = (): string => {
  return (
    process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ""
  );
};

// token status
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

// handle rate-limit
const handleGitHubError = (res: Response, error: unknown, defaultMsg: string) => {
  console.error(defaultMsg, error);
  const axiosErr = error as AxiosError<{ message?: string }>;
  const statusCode = axiosErr.response?.status || 500;
  const isRateLimit =
    statusCode === 403 &&
    (axiosErr.response?.headers?.["x-ratelimit-remaining"] === "0" ||
      (typeof axiosErr.response?.data?.message === "string" &&
        axiosErr.response.data.message.toLowerCase().includes("rate limit")));

  const resetHeader = axiosErr.response?.headers?.["x-ratelimit-reset"];
  let retryAfterSeconds: number | undefined;
  if (resetHeader) {
    const rawVal = Array.isArray(resetHeader) ? resetHeader[0] : String(resetHeader);
    const resetEpoch = parseInt(rawVal, 10);
    if (!isNaN(resetEpoch) && resetEpoch > 0) {
      const nowEpochSec = Math.floor(Date.now() / 1000);
      retryAfterSeconds = Math.max(0, resetEpoch - nowEpochSec);
    }
  }

  const errorMessage = isRateLimit
    ? "GitHub API rate limit exceeded (60 requests/hr unauthenticated limit). Cached entries will continue to serve. Please wait a few moments or configure GITHUB_TOKEN in backend environment variables."
    : statusCode === 401
    ? "GitHub upstream authentication failed. Please check the server GITHUB_TOKEN configuration."
    : axiosErr.response?.data?.message || (axiosErr instanceof Error ? axiosErr.message : defaultMsg);

  if (isRateLimit) {
    res.setHeader("Retry-After", String(retryAfterSeconds ?? 60));
  }

  const clientStatus = statusCode === 401 ? 502 : statusCode;
  res.status(clientStatus).json({
    error: errorMessage,
    isRateLimit,
    retryAfter: retryAfterSeconds ?? (isRateLimit ? 60 : undefined),
    details: axiosErr.response?.data || (axiosErr instanceof Error ? axiosErr.message : defaultMsg),
  });
};

const isValidRepoIdentifier = (str: string): boolean => {
  return typeof str === "string" && /^[a-zA-Z0-9_.-]+$/.test(str);
};

// repo contents
router.get(
  "/repo/:owner/:repo/contents/*",
  verifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { owner, repo } = req.params;
      if (!owner || !repo) {
        return res.status(400).json({ error: "Invalid repository owner or name." });
      }
      const cleanRepo = repo.replace(/\.git$/i, "");
      if (!isValidRepoIdentifier(owner) || !isValidRepoIdentifier(cleanRepo)) {
        return res.status(400).json({ error: "Invalid repository owner or name." });
      }
      const rawPath = String(req.params[0] || "");
      let decodedPath = rawPath;
      try {
        decodedPath = decodeURIComponent(rawPath);
      } catch {
        return res.status(400).json({ error: "Invalid path encoding" });
      }
      const segments = decodedPath.split("/").filter(Boolean);
      if (segments.some((seg) => seg === "." || seg === "..")) {
        return res.status(400).json({ error: "Invalid path: directory traversal is not allowed" });
      }
      const normalizedPath = segments.join("/");
      const encodedPath = segments.map((seg) => encodeURIComponent(seg)).join("/");
      const scope = req.userId || "anon";
      const cacheKey = `${scope}:contents:${owner.toLowerCase()}:${cleanRepo.toLowerCase()}:${normalizedPath}`;

      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const githubApiUrl = encodedPath
        ? `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${encodedPath}`
        : `https://api.github.com/repos/${owner}/${cleanRepo}/contents`;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CollabClass-App",
      };

      const githubToken = getGitHubToken();
      if (githubToken) {
        headers["Authorization"] = `Bearer ${githubToken}`;
      }

      const response = await axios.get(githubApiUrl, { headers, timeout: 10000 });
      setCache(cacheKey, response.data);
      res.json(response.data);
    } catch (error: unknown) {
      handleGitHubError(res, error, "Failed to fetch repository contents");
    }
  },
);

// root contents
router.get("/repo/:owner/:repo/contents", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    if (!owner || !repo) {
      return res.status(400).json({ error: "Invalid repository owner or name." });
    }
    const cleanRepo = repo.replace(/\.git$/i, "");
    if (!isValidRepoIdentifier(owner) || !isValidRepoIdentifier(cleanRepo)) {
      return res.status(400).json({ error: "Invalid repository owner or name." });
    }
    const scope = req.userId || "anon";
    const cacheKey = `${scope}:contents:${owner.toLowerCase()}:${cleanRepo.toLowerCase()}:root`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/contents`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CollabClass-App",
    };

    const githubToken = getGitHubToken();
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    const response = await axios.get(githubApiUrl, { headers, timeout: 10000 });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error: unknown) {
    handleGitHubError(res, error, "Failed to fetch repository root contents");
  }
});

// repo info
router.get("/repo/:owner/:repo", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    if (!owner || !repo) {
      return res.status(400).json({ error: "Invalid repository owner or name." });
    }
    const cleanRepo = repo.replace(/\.git$/i, "");
    if (!isValidRepoIdentifier(owner) || !isValidRepoIdentifier(cleanRepo)) {
      return res.status(400).json({ error: "Invalid repository owner or name." });
    }
    const scope = req.userId || "anon";
    const cacheKey = `${scope}:info:${owner.toLowerCase()}:${cleanRepo.toLowerCase()}`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CollabClass-App",
    };

    const githubToken = getGitHubToken();
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    const response = await axios.get(githubApiUrl, { headers, timeout: 10000 });
    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error: unknown) {
    handleGitHubError(res, error, "Failed to fetch repository information");
  }
});

export { router as githubRoutes };
