import { dexieDataAccess, type ObservabilityDataAccess, type WebhookDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

type EventDb = ObservabilityDataAccess & WebhookDataAccess;

let _deps: { db: EventDb } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: EventDb }) {
  _deps = Object.freeze({ ...deps });
}

export type EventType =
  | "page_view"
  | "feature_use"
  | "quiz_start"
  | "quiz_complete"
  | "flashcard_review"
  | "exam_start"
  | "exam_complete"
  | "study_plan_generate"
  | "tts_play"
  | "search"
  | "pwa_install"
  | "offline_visit";

export interface TrackEvent {
  type: EventType;
  label: string;
  metadata?: Record<string, string | number>;
  timestamp: string;
}

const STORAGE_KEY = "lumni_usage_events";
const MAX_EVENTS = 2000;

function loadEvents(): TrackEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackEvent[]) : [];
  } catch (err) {
    logError("LoadEvents", err);
    return [];
  }
}

function saveEvents(events: TrackEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch (err) {
    logError("SaveEvents", err);
  }
}

let _dispatcher: {
  dispatchWebhook(event: string, payload: Record<string, unknown>): Promise<void>;
} | null = null;

async function fireWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (!_dispatcher) {
      const { createRegistry } = await import("@/lib/webhooks/registry");
      const { createDispatcher } = await import("@/lib/webhooks/dispatcher");
      const registry = createRegistry(_deps.db);
      _dispatcher = createDispatcher({ db: _deps.db, registry });
    }
    await _dispatcher.dispatchWebhook(event, payload);
  } catch (err) {
    logError("FireWebhook", err);
  }
}

export function trackEvent(
  type: EventType,
  label: string,
  metadata?: Record<string, string | number>,
): void {
  const events = loadEvents();
  events.push({ type, label, metadata, timestamp: new Date().toISOString() });
  saveEvents(events);
}

/* ── Dexie-backed analytics events (1.4 WAM + retention) ── */

export async function trackSessionStart(userId: string, sessionId: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  try {
    await _deps.db.analyticsEvents.add({
      eventType: "session_start",
      userId,
      sessionId,
      timestamp: Date.now(),
    });
    fireWebhook("study-session.started", { userId, sessionId, timestamp: Date.now() });
  } catch (err) {
    logError("TrackSessionStart", err);
  }
}

export async function trackSessionEnd(userId: string, sessionId: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  try {
    await _deps.db.analyticsEvents.add({
      eventType: "session_end",
      userId,
      sessionId,
      timestamp: Date.now(),
    });
    fireWebhook("study-session.ended", { userId, sessionId, timestamp: Date.now() });
  } catch (err) {
    logError("TrackSessionEnd", err);
  }
}

export async function trackDayActive(userId: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = await _deps.db.analyticsEvents
      .where("eventType")
      .equals("day_active")
      .filter((e) => e.userId === userId && e.timestamp >= todayStart.getTime())
      .first();
    if (existing) return;
    await _deps.db.analyticsEvents.add({
      eventType: "day_active",
      userId,
      timestamp: Date.now(),
    });
  } catch (err) {
    logError("TrackDayActive", err);
  }
}

export interface CohortStats {
  dau: number;
  wau: number;
  totalActiveUsers: number;
  dailyCounts: { date: string; count: number }[];
}

export async function getCohortStats(days = 30): Promise<CohortStats> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return { dau: 0, wau: 0, totalActiveUsers: 0, dailyCounts: [] };
  }
  try {
    const now = Date.now();
    const dayMs = 86400000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * dayMs;
    const monthAgo = now - days * dayMs;

    const events = await _deps.db.analyticsEvents
      .where("eventType")
      .anyOf(["day_active", "session_start"])
      .filter((e) => e.timestamp >= monthAgo)
      .toArray();

    const dauSet = new Set<string>();
    const wauSet = new Set<string>();
    for (const e of events) {
      if (e.timestamp >= todayStart.getTime()) dauSet.add(e.userId);
      if (e.timestamp >= weekAgo) wauSet.add(e.userId);
    }
    const dau = dauSet.size;
    const wau = wauSet.size;
    const totalActiveUsers = new Set(events.map((e) => e.userId)).size;

    const dailyMap = new Map<string, Set<string>>();
    for (let i = 0; i < days; i++) {
      const d = new Date(now - i * dayMs);
      dailyMap.set(d.toISOString().slice(0, 10), new Set());
    }
    for (const e of events) {
      const key = new Date(e.timestamp).toISOString().slice(0, 10);
      const set = dailyMap.get(key);
      if (set) set.add(e.userId);
    }
    const dailyCounts = Array.from(dailyMap.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .toSorted((a, b) => a.date.localeCompare(b.date));

    return { dau, wau, totalActiveUsers, dailyCounts };
  } catch (err) {
    logError("GetCohortStats", err);
    return { dau: 0, wau: 0, totalActiveUsers: 0, dailyCounts: [] };
  }
}

export function getEventSummary() {
  const events = loadEvents();
  if (events.length === 0) {
    return { totalEvents: 0, byType: {}, recentEvents: [] };
  }

  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  const lastDay = events.filter((e) => Date.now() - new Date(e.timestamp).getTime() < 86400000);

  return {
    totalEvents: events.length,
    last24h: lastDay.length,
    byType,
    recentEvents: events.slice(-20).toReversed(),
  };
}

export function clearEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logError("ClearEvents", err);
  }
}
