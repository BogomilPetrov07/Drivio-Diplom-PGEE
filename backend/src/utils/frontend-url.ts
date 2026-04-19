import { env } from "../config/env.js";

function normalizeUrl(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

export function getPreferredFrontendUrl() {
  const urls = env.FRONTEND_URL
    .split(",")
    .map((part) => normalizeUrl(part))
    .filter(Boolean);

  if (urls.length === 0) {
    return "http://localhost:5173";
  }

  const preferredAppLocalhost = urls.find((url) => {
    try {
      return new URL(url).hostname === "app.localhost";
    } catch {
      return false;
    }
  });

  if (preferredAppLocalhost) {
    return preferredAppLocalhost;
  }

  return urls[0];
}
