# Dashboard + Practice Tab + Offline Packs Redesign

## Execution Order

### 0. Prerequisite

```bash
New-Item -ItemType Directory -Path "src\components\dashboard\parts" -Force
```

### 1. Create `src/components/dashboard/parts/storage-ring.tsx`

SVG circular progress indicator for offline pack storage. 48×48px, animated arc, color shifts green→amber→red at 50%/80% thresholds.

```tsx
"use client";

interface StorageRingProps {
  used: number;
  limit: number;
  size?: number;
  strokeWidth?: number;
}

export function StorageRing({ used, limit, size = 48, strokeWidth = 4 }: StorageRingProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage < 50
      ? "stroke-(--system-accent)"
      : percentage < 80
        ? "stroke-amber-500"
        : "stroke-red-500";

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-500 ease-(--ease-ios)`}
        />
      </svg>
      <span className="absolute font-semibold text-[10px] tabular-nums text-muted-foreground">
        {Math.round(percentage)}%
      </span>
      <span className="sr-only">
        {formatBytes(used)} used of {formatBytes(limit)} — {Math.round(percentage)}%
      </span>
    </div>
  );
}
```

### 2. Create `src/components/dashboard/parts/offline-pack-card.tsx`

Extracted pack tile with status-aware rendering. New imports needed:

- `CloudTimeIcon`, `Loader03Icon`, `RefreshIcon` from `@hugeicons/core-free-icons`

```tsx
"use client";

import CloudTimeIcon from "@hugeicons/core-free-icons/CloudTimeIcon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import FileDownloadIcon from "@hugeicons/core-free-icons/FileDownloadIcon";
import Loader03Icon from "@hugeicons/core-free-icons/Loader03Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import Time03Icon from "@hugeicons/core-free-icons/Time03Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizPack } from "@/lib/quiz-packs";

interface OfflinePackCardProps {
  pack: QuizPack;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatPackBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: QuizPack["status"] }) {
  switch (status) {
    case "generating":
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        >
          <Loader03Icon className="size-3 animate-spin" />
          Generating
        </Badge>
      );
    case "ready":
      return (
        <Badge className="bg-(--system-accent)/10 text-(--system-accent) hover:bg-(--system-accent)/15">
          Ready
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          <CloudTimeIcon className="mr-1 size-3" />
          Expired
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="destructive"
          className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        >
          Failed
        </Badge>
      );
  }
}

export function OfflinePackCard({ pack, onPlay, onRemove }: OfflinePackCardProps) {
  return (
    <div className="group relative flex flex-col gap-2.5 rounded-card border border-border/60 bg-card p-4 shadow-level-1 transition-all duration-300 hover:shadow-level-2 press-scale">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--system-accent)/10">
            <FileDownloadIcon className="size-4 text-(--system-accent)" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{pack.title}</p>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span>{pack.questionCount} questions</span>
              <span className="text-border">·</span>
              <span>{formatPackBytes(pack.storageBytes)}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={pack.status} />
      </div>

      {pack.expiresAt && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Time03Icon className="size-3" />
          <span>
            {pack.status === "expired" ? "Expired " : "Expires "}
            {new Date(pack.expiresAt).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}

      {pack.status === "generating" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-(--system-accent)" />
        </div>
      )}

      <div className="flex items-center gap-1 pt-0.5">
        {pack.status === "ready" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlay(pack.id)}
            aria-label={`Play ${pack.title}`}
            className="gap-1.5 text-xs"
          >
            <PlayIcon className="size-3.5" /> Play
          </Button>
        )}
        {pack.status === "failed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlay(pack.id)}
            aria-label={`Retry ${pack.title}`}
            className="gap-1.5 text-xs"
          >
            <RefreshIcon className="size-3.5" /> Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(pack.id)}
          aria-label={`Delete ${pack.title}`}
          className="ml-auto gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <Delete02Icon className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
```

Note: HugeiconsIcon wrapper must wrap all icon imports — the above uses raw icons for brevity but the actual code must use `<HugeiconsIcon icon={IconName} className="..." />` pattern.

### 3. Rewrite `src/components/dashboard/offline-packs.tsx`

Replace entire file. Import `StorageRing` and `OfflinePackCard` from `./parts/`. Layout:

```
Card
  CardHeader (title "Offline Study Packs" + storage ring + usage text)
  CardContent
    Controls row: subject select + count input + download button
    Divider
    Pack grid: grid-cols-1 sm:grid-cols-2 gap-3
      → OfflinePackCard per pack
    Empty state (when packs.length === 0): centered, larger icon, descriptive text
```

Full code plan:

```tsx
"use client";

import CloudDownloadIcon from "@hugeicons/core-free-icons/CloudDownloadIcon";
import CloudOffIcon from "@hugeicons/core-free-icons/CloudOffIcon";
import FileDownloadIcon from "@hugeicons/core-free-icons/FileDownloadIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuizPacks } from "@/hooks/use-quiz-packs";
import { useSubjects } from "@/hooks/use-subjects";
import { StorageRing } from "@/components/dashboard/parts/storage-ring";
import { OfflinePackCard } from "@/components/dashboard/parts/offline-pack-card";

export function OfflinePackManager() {
  const {
    packs,
    generating,
    storageBytes,
    storagePercentage,
    storageLimit,
    generate,
    remove,
    playPack,
  } = useQuizPacks();
  const { data: subjectsData } = useSubjects();
  const subjects = subjectsData?.subjects ?? [];
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questionCount, setQuestionCount] = useState("10");

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    await generate(selectedSubject, null, Number.parseInt(questionCount, 10) || 10);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-(--system-accent)/10">
            <HugeiconsIcon icon={FileDownloadIcon} className="size-5 text-(--system-accent)" />
          </div>
          <div className="min-w-0">
            <CardTitle className="font-extrabold text-base tracking-tight">
              Offline Study Packs
            </CardTitle>
            <p className="text-muted-foreground text-xs leading-tight">
              Study anywhere, no internet needed
            </p>
          </div>
        </div>
        <StorageRing used={storageBytes} limit={storageLimit} />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? "")}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.code} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-16 h-9 text-sm"
            placeholder="10"
          />
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || !selectedSubject}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={CloudDownloadIcon} className="size-4" />
            {generating ? "Generating…" : "Download"}
          </Button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60" />

        {/* Pack grid or empty state */}
        {packs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40">
              <HugeiconsIcon icon={CloudOffIcon} className="size-6 text-muted-foreground/60" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm text-muted-foreground">No packs yet</p>
              <p className="max-w-xs text-muted-foreground/60 text-xs leading-relaxed">
                Pick a subject and questions count above, then download your first offline pack.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packs.map((pack) => (
              <OfflinePackCard key={pack.id} pack={pack} onPlay={playPack} onRemove={remove} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. Rewrite `src/components/dashboard/practice-tab.tsx`

Convert to responsive grid layout. Replace the single-column `<StaggerProvider>` → `<StaggeredSection>` stack with:

```
<StaggerProvider baseDelay={0.02}>
  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
    <!-- Hero cards (full-width) -->
    <div className="sm:col-span-2 lg:col-span-3">
      <StaggeredSection><FocusTimerCard /></StaggeredSection>
    </div>
    ...

    <!-- Medium cards (2-col on lg) -->
    <div className="lg:col-span-2">
      <StaggeredSection><StreakCard /></StaggeredSection>
    </div>

    <!-- Compact cards (1-col) -->
    <StaggeredSection><BloomTaxonomyWidget /></StaggeredSection>
  </div>
</StaggerProvider>
```

Card span assignments:

| Card                            | Mobile | Tablet (sm)  | Desktop (lg) |
| ------------------------------- | ------ | ------------ | ------------ |
| FocusTimerCard                  | 1      | 2 (full row) | 3 (full row) |
| AnonymousUpsell (conditional)   | 1      | 2            | 3            |
| QuestionOfTheDayCard            | 1      | 2            | 3            |
| NextBestActionCard (logged in)  | 1      | 2            | 3            |
| TodayFocusCard (logged in)      | 1      | 2            | 3            |
| LessonLibraryCard (logged in)   | 1      | 1            | 2            |
| VocabularyListCard (logged in)  | 1      | 1            | 1            |
| LearningMapCard (logged in)     | 1      | 2            | 3            |
| MyAssignments (logged in)       | 1      | 1            | 1            |
| StudyCard (logged in)           | 1      | 1            | 1            |
| StreakCard (logged in)          | 1      | 1            | 1            |
| RecentQuestionsCard (logged in) | 1      | 1            | 2            |
| StudyPlanOverview (logged in)   | 1      | 2            | 3            |
| CompetencyOverview (logged in)  | 1      | 1            | 1            |
| BloomTaxonomyWidget (logged in) | 1      | 1            | 1            |
| OfflinePackManager              | 1      | 2            | 3            |
| WeakTopicsCard (logged in)      | 1      | 1            | 2            |
| QuickActions                    | 1      | 2            | 3            |
| QuizStartCard                   | 1      | 2            | 3            |

Pattern for hero cards (full width):

```tsx
{
  isLoggedIn && (
    <div className="sm:col-span-2 lg:col-span-3">
      <StaggeredSection>
        <TodayFocusCard />
      </StaggeredSection>
    </div>
  );
}
```

Pattern for compact cards:

```tsx
{
  isLoggedIn && (
    <StaggeredSection>
      <CompetencyOverview />
    </StaggeredSection>
  );
}
```

Grid wrapper goes just inside StaggerProvider, around all sections. Each StaggeredSection can be wrapped in a span div when needed, or placed directly for 1-col cards.

### 5. Gridify `src/components/dashboard/today-tab.tsx`

Within each `<CollapsibleSection>` / `<CollapsibleSectionAlwaysOpen>` body, convert `flex flex-col gap-3` sections to responsive grids similar to practice tab.

**"Get started" section** (CollapsibleSectionAlwaysOpen):

- Wrap `section` content in `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4`
- DailyChallengeCard → full width
- UpcomingExamCard → 1 col
- Bolt complete banner → full width
- FeedSection → full width
- TodayFocusCard → 2 cols
- GettingStartedCard → 1 col
- NotificationNudge → full width

**"Your Progress" section**:

- StreakCard can share a row with something on desktop, but keep as 1-col for simplicity

**"Study Tools" section**:

- `grid grid-cols-1 sm:grid-cols-2 gap-3`
- FocusTimerCard → full width
- QuestionOfTheDayCard → 1 col
- WordOfDayCard → 1 col (pairs with QOTD)
- PronunciationChartCard → full width
- StoriesProgressCard → full width
- WeakTopicsCard → full width

**"More" section**:

- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`
- LessonLibraryCard → 2 cols
- VocabularyListCard → 1 col
- LearningMapCard → 3 cols
- RewardChestPanel → 1 col
- CompetitionCard → 1 col
- QuickActions → 3 cols

### 6. Gridify `src/components/dashboard/analytics-tab.tsx`

Wrap StaggerProvider children in `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5`.

| Component                 | Span   |
| ------------------------- | ------ |
| ComparativeAnalyticsPanel | full   |
| StatsRow                  | full   |
| LeaderboardCard           | 2 cols |
| AchievementShowcase       | 1 col  |
| RewardChestPanel          | 1 col  |
| MasteryHeatmap Card       | 3 cols |

### 7. Spacing refinement in `src/components/dashboard/dashboard-content.tsx`

Change:

```tsx
<PageContainer className="gap-6">
```

to:

```tsx
<PageContainer className="gap-4 sm:gap-5 lg:gap-6">
```

### 8. `press-scale` + hover polish pass

Check each interactive card for missing `press-scale` class and `transition-[scale,...] duration-300`. Currently present on: StudyCard, UpcomingExamCard, QuickAction buttons. Missing from:

- **`weak-topics-card.tsx`** — add `press-scale` and `transition-[scale,box-shadow,background-color,transform] duration-300` to the Card wrapper
- **`study-card.tsx`** — already has it (good)
- **`streak-card.tsx`** — read file and add if missing
- **`recent-questions-card.tsx`** — read file and add if missing
- **`competency-overview.tsx`** — read file and add if missing
- **`learning-map-card.tsx`** — read file and add if missing

Pattern to add:

```tsx
className =
  "cursor-pointer overflow-hidden rounded-card shadow-level-1 transition-[scale,box-shadow,background-color,transform] duration-300 hover:bg-muted/50 press-scale";
```

### Verification

After all changes:

1. `pnpm run typecheck` — 0 errors
2. `pnpm exec biome check` — 0 warnings on changed files
3. `pnpm run test` — no regressions
4. Visual check: mobile single-column unchanged, tablet shows 2‑col grid, desktop shows 3‑col bento
5. Offline packs render as tiles instead of rows, storage ring visible, empty state centered
