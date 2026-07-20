"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import NoteIcon from "@hugeicons/core-free-icons/NoteIcon";
import Quiz03Icon from "@hugeicons/core-free-icons/Quiz03Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useContext } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dexieDataAccess } from "@/lib/db";
import type { CachedStory } from "@/lib/stories/types";
import type { QuizPack } from "@/lib/quiz-packs/types";
import type { StoryProgressRecord } from "@/lib/db/types";
import { useOfflineStats } from "@/hooks/use-offline-stats";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { SyncContext } from "@/components/providers/sync-provider";
import type { SyncStatus } from "@/lib/sync/types";
import { OfflineTracker } from "./offline-tracker";

const formatTime = (ts: number | null) => {
  if (!ts) return "Never";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ts));
};

function SyncStatusBar() {
  const syncCtx = useContext(SyncContext);
  const syncContextAvailable = !!syncCtx;
  const status: SyncStatus = syncCtx?.status ?? {
    state: "idle",
    pendingWrites: 0,
    lastSyncAt: null,
    lastError: null,
  };
  const triggerSync: () => void = syncCtx?.triggerSync ?? (() => {});

  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <HugeiconsIcon icon={RefreshIcon} className="size-3" />
        {syncContextAvailable ? (
          <span>Last sync: {formatTime(status.lastSyncAt)}</span>
        ) : (
          <span>Sync status unavailable offline</span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-full text-(--fs-caption-3)"
        onClick={() => {
          if (isOnline) {
            triggerSync();
          } else {
            window.location.reload();
          }
        }}
      >
        {isOnline ? "Sync now" : "Try reconnecting"}
      </Button>
    </div>
  );
}

export default function OfflinePage() {
  const stats = useOfflineStats();

  const recentStories = useLiveQuery(() =>
    dexieDataAccess.storyProgress.orderBy("lastReadAt").reverse().limit(5).toArray(),
  );

  const readyPacks = useLiveQuery(() =>
    dexieDataAccess.quizPacks.where("status").equals("ready").reverse().sortBy("createdAt"),
  );

  const storyTitles = useLiveQuery(async () => {
    if (!recentStories || recentStories.length === 0) return [];
    const keys = recentStories.map((r) => r.storyId);
    const cached = await dexieDataAccess.storyCache.where("key").anyOf(keys).toArray();
    const map = new Map(cached.map((c: CachedStory) => [c.story.id, c.story.title]));
    return recentStories.map((r: StoryProgressRecord) => ({
      storyId: r.storyId,
      title: map.get(r.storyId) ?? r.storyId,
    }));
  }, [recentStories]);

  return (
    <PageContainer className="min-h-dvh gap-6">
      <OfflineTracker />

      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-warning/10">
          <svg
            className="size-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            role="img"
            aria-label="Offline indicator"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 14a2 2 0 100-4 2 2 0 000 4z"
            />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-2xl tracking-tight">You&apos;re Offline</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Don&apos;t worry, your saved content is still available.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild className="w-full gap-2">
          <Link href="/quiz" prefetch={true}>
            <HugeiconsIcon icon={Quiz03Icon} data-icon="inline-start" />
            Practice Offline
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full gap-2">
          <Link href="/flashcards" prefetch={true}>
            <HugeiconsIcon icon={NoteIcon} data-icon="inline-start" />
            Review Flashcards
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <h2 className="mb-2 font-semibold text-sm">Available Offline</h2>
        <ul className="flex flex-col gap-1.5 text-muted-foreground text-xs">
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-success" />
            Quiz packs you&apos;ve downloaded
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-success" />
            Flashcards and spaced repetition
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-success" />
            Past quiz results and progress
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-success" />
            Downloaded stories and study guides
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/quiz"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={DatabaseIcon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-lg tabular-nums">{stats.questions}</span>
          <span className="text-muted-foreground text-xs">questions cached</span>
        </Link>
        <Link
          href="/flashcards"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={NoteIcon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-lg tabular-nums">{stats.flashcards}</span>
          <span className="text-muted-foreground text-xs">flashcards to review</span>
        </Link>
        <Link
          href="/study-guide"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-lg tabular-nums">{stats.guides}</span>
          <span className="text-muted-foreground text-xs">study guides</span>
        </Link>
        <Link
          href="/quiz"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={Quiz03Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-lg tabular-nums">{stats.packs}</span>
          <span className="text-muted-foreground text-xs">quiz packs</span>
        </Link>
      </div>

      {stats.pendingSync > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-muted-foreground text-xs">
          <HugeiconsIcon icon={RefreshIcon} className="size-3" />
          {stats.pendingSync} change{stats.pendingSync !== 1 ? "s" : ""} pending sync
        </div>
      )}

      <SyncStatusBar />

      {storyTitles && storyTitles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
              Recently Read Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {storyTitles.map((s: { storyId: string; title: string }) => (
                <li key={s.storyId}>
                  <Link
                    href={`/stories/${s.storyId}`}
                    className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {readyPacks && readyPacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={Quiz03Icon} className="size-4" />
              Offline Quiz Packs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {readyPacks.slice(0, 5).map((pack: QuizPack) => (
                <li key={pack.id}>
                  <Link
                    href={`/quiz?subject=${encodeURIComponent(pack.subject)}&packId=${encodeURIComponent(pack.id)}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="truncate">{pack.title}</span>
                    <Badge variant="outline" className="shrink-0 text-(--fs-caption-3)">
                      {pack.questionCount} Q
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(!readyPacks || readyPacks.length === 0) && (!storyTitles || storyTitles.length === 0) && (
        <p className="text-center text-muted-foreground text-xs">
          No saved stories or quiz packs yet. Start studying online and they&apos;ll be available
          here when you&apos;re offline.
        </p>
      )}
    </PageContainer>
  );
}
