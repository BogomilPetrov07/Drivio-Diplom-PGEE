import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const localAllowedOrigins = new Set([
    "http://localhost",
    "http://app.localhost",
    "http://api.localhost",
    "https://localhost",
    "https://app.localhost",
    "https://api.localhost",
]);

const allowedOrigins = new Set(
    env.FRONTEND_URL
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

for (const origin of localAllowedOrigins) {
    allowedOrigins.add(origin);
}

function toOrigin(value: string) {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
    const originHeader = req.get("origin");
    if (originHeader) {
        if (allowedOrigins.has(originHeader)) return next();
        return res.sendStatus(403);
    }

    const refererHeader = req.get("referer");
    if (refererHeader) {
        const refererOrigin = toOrigin(refererHeader);
        if (refererOrigin && allowedOrigins.has(refererOrigin)) return next();
        return res.sendStatus(403);
    }

    // Some browser/platform combinations may omit Origin/Referer on same-site requests.
    // Accept only explicitly same-site fetch metadata as a safe fallback.
    const fetchSite = (req.get("sec-fetch-site") || "").toLowerCase();
    if (fetchSite === "same-origin" || fetchSite === "same-site") {
        return next();
    }

    return res.sendStatus(403);
}
