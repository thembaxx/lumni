import { NextResponse } from "next/server";
import { dexieDataAccess } from "@/lib/db";
import { DigestService } from "@/lib/digest";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { requireAdmin } = await import("@/lib/server/auth");
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = new DigestService({ db: dexieDataAccess });
  const stats = await service.computeWeeklyStats();
  const { title, body } = service.formatDigestMessage(stats);
  const result = await service.sendPushNotifications(title, body);

  return NextResponse.json({ success: true, ...result });
}
