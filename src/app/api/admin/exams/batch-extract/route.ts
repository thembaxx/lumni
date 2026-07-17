import fs from "node:fs";
import path from "node:path";
import { isIP } from "node:net";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

const ALLOWED_DOMAINS = [
  "www.education.gov.za",
  "wcedeportal.co.za",
  "wced.wcape.school.za",
  "www.wced.wcape.school.za",
  "pastpapers.wcape.school.za",
  "www.pastpapers.wcape.school.za",
];

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isAllowedUrl(urlString: string): { allowed: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { allowed: false, reason: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { allowed: false, reason: `Protocol "${parsed.protocol}" not allowed` };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isIP(hostname)) {
    if (PRIVATE_IP_PATTERNS.some((p) => p.test(hostname))) {
      return { allowed: false, reason: "Private IP ranges are not allowed" };
    }
    return { allowed: true };
  }

  const allowed = ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!allowed) {
    return { allowed: false, reason: `Domain "${hostname}" is not in the allowlist` };
  }

  return { allowed: true };
}

async function fetchParsedPaper(id: string) {
  const filePath = path.resolve(process.cwd(), "exam-data", "parsed", `${id}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

export const GET = createRouteHandler({
  auth: "admin",
  execute: async ({ params }) => {
    const id = params?.id;
    if (!id) throw new HttpError(400, "Missing paper ID");

    const paper = await fetchParsedPaper(id);
    if (!paper) throw new HttpError(404, "Parsed paper not found");

    return paper;
  },
  errorLabel: "Batch extract GET",
});

export const POST = createRouteHandler({
  auth: "admin",
  validate: (body: Record<string, unknown>) => {
    if (!body.urls || !Array.isArray(body.urls)) return "Missing or invalid urls array";
    return null;
  },
  execute: async ({ body }) => {
    const { urls } = body as { urls: string[] };
    const outputDir = path.resolve(process.cwd(), "exam-data", "extracted");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        const check = isAllowedUrl(url);
        if (!check.allowed) {
          return { url, success: false, error: check.reason };
        }

        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const text = await response.text();
          const fileName = `extracted_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`;
          fs.writeFileSync(path.join(outputDir, fileName), text, "utf-8");
          return { url, success: true };
        } catch (error) {
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    return { results };
  },
  errorLabel: "Batch extract POST",
});
