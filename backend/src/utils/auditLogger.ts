import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import prisma from "../lib/prisma";
import type { SecurityAction } from "@prisma/client";

interface AuditLogOptions {
  action: SecurityAction;
  userId?: string | null;
  details?: string;
  metadata?: Record<string, any>;
}

export function extractClientMetadata(req: Request) {
  // 1. Resolve real client IP across reverse proxies (Render, Cloudflare, Nginx)
  const forwarded = req.headers["x-forwarded-for"];
  let ipAddress = "";

  if (typeof forwarded === "string") {
    ipAddress = forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ipAddress = forwarded[0].trim();
  } else {
    ipAddress = req.socket.remoteAddress || req.ip || "unknown";
  }

  // Normalize IPv6 mapped IPv4 (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ipAddress.startsWith("::ffff:")) {
    ipAddress = ipAddress.substring(7);
  }

  // 2. Parse User-Agent
  const rawUserAgent = req.headers["user-agent"] || "";
  const parser = new UAParser(rawUserAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let formattedDevice = "Desktop";
  if (device.type === "mobile") formattedDevice = "Mobile";
  else if (device.type === "tablet") formattedDevice = "Tablet";

  const deviceSummary = [
    browser.name ? `${browser.name} ${browser.major || ""}`.trim() : null,
    os.name ? `on ${os.name} ${os.version || ""}`.trim() : null,
    `(${formattedDevice})`,
  ]
    .filter(Boolean)
    .join(" ");

  // 3. Resolve Geolocation
  // Prefer Cloudflare/Proxy headers if present, fall back to geoip-lite lookup
  const headerCountry = (req.headers["cf-ipcountry"] as string) || (req.headers["x-country-code"] as string);
  
  let country: string | null = headerCountry || null;
  let city: string | null = (req.headers["cf-ipcity"] as string) || null;

  if (!country && ipAddress && ipAddress !== "127.0.0.1" && ipAddress !== "localhost" && !ipAddress.startsWith("192.168.")) {
    const geo = geoip.lookup(ipAddress);
    if (geo) {
      country = geo.country || null;
      city = geo.city || null;
    }
  }

  return {
    ipAddress: ipAddress || "unknown",
    userAgent: rawUserAgent || "unknown",
    device: deviceSummary || "Unknown Device",
    country,
    city,
  };
}

export async function logSecurityEvent(req: Request, options: AuditLogOptions) {
  try {
    const client = extractClientMetadata(req);

    return await prisma.securityEvent.create({
      data: {
        action: options.action,
        userId: options.userId ?? null,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        device: client.device,
        country: client.country,
        city: client.city,
        details: options.details ?? null,
        metadata: options.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure telemetry never interrupts the main request flow
    console.error("Failed to log security event:", error);
    return null;
  }
}



