/**
 * Utility to safely resolve the backend API URL across environments.
 * Removes any trailing slashes and falls back gracefully.
 */
export const getBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_BE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  // Default fallback for development or LAN testing
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^192\.168\.\d+\.\d+$/.test(host) ||
      /^10\.\d+\.\d+\.\d+$/.test(host)
    ) {
      return `http://${host}:4000`;
    }
  }
  return "";
};
