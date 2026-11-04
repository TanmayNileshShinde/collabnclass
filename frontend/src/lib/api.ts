/**
 * Utility to safely resolve the backend API URL across environments.
 * Removes any trailing slashes and falls back gracefully.
 */
export const getBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_BE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  // Default fallback for development or production relative path
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "";
};
