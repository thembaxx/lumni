import type { FlagOverride } from "@/lib/shared/flags/types";
import { flagRegistry } from "@/lib/shared/flags/registry";
import { createRouteHandler } from "@/lib/api/create-route-handler";

const overrides = new Map<string, FlagOverride>();

function overrideKey(key: string, userId?: string): string {
  return userId ? `${key}:user:${userId}` : key;
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "FlagsGet",
  execute: async () => {
    const allOverrides = Array.from(overrides.values());
    return { flags: flagRegistry, overrides: allOverrides };
  },
});

export const POST = createRouteHandler<{
  key: string;
  enabled: boolean;
  userId?: string;
  rolloutPercentage?: number;
}>({
  auth: "admin",
  errorLabel: "FlagsPost",
  parseBody: async (req) =>
    (await req.json()) as {
      key: string;
      enabled: boolean;
      userId?: string;
      rolloutPercentage?: number;
    },
  validate: (body) => {
    if (!body.key) return "Flag key is required";
    if (typeof body.enabled !== "boolean") return "Enabled must be a boolean";
    return null;
  },
  execute: async ({ body }) => {
    const mapKey = overrideKey(body.key, body.userId);
    const existing = overrides.get(mapKey);
    const merged: FlagOverride = {
      ...(existing ?? { key: body.key, enabled: body.enabled }),
      key: body.key,
      enabled: body.enabled,
      ...(body.userId !== undefined && { userId: body.userId }),
      ...(body.rolloutPercentage !== undefined && { rolloutPercentage: body.rolloutPercentage }),
    };
    overrides.set(mapKey, merged);
    return { success: true, override: merged };
  },
});

export const DELETE = createRouteHandler<{ key: string; userId?: string }>({
  auth: "admin",
  errorLabel: "FlagsDelete",
  parseBody: async (req) => (await req.json()) as { key: string; userId?: string },
  validate: (body) => (!body.key ? "Flag key is required" : null),
  execute: async ({ body }) => {
    overrides.delete(overrideKey(body.key, body.userId));
    return { success: true };
  },
});
