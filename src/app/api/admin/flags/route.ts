import { type NextRequest, NextResponse } from "next/server";
import type { FlagOverride } from "@/lib/shared/flags/types";
import { flagRegistry } from "@/lib/shared/flags/registry";

const overrides = new Map<string, FlagOverride>();

function overrideKey(key: string, userId?: string): string {
  return userId ? `${key}:user:${userId}` : key;
}

function adminAuthorized(req: NextRequest): boolean {
  const { searchParams } = new URL(req.url);
  return searchParams.get("adminKey") === "admin";
}

export async function GET(req: NextRequest) {
  if (!adminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allOverrides = Array.from(overrides.values());
  return NextResponse.json({
    flags: flagRegistry,
    overrides: allOverrides,
  });
}

export async function POST(req: NextRequest) {
  if (!adminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      key: string;
      enabled: boolean;
      userId?: string;
      rolloutPercentage?: number;
    };

    if (!body.key) {
      return NextResponse.json({ error: "Flag key is required" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, override: merged });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!adminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { key: string; userId?: string };
    if (!body.key) {
      return NextResponse.json({ error: "Flag key is required" }, { status: 400 });
    }

    const mapKey = overrideKey(body.key, body.userId);
    overrides.delete(mapKey);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
