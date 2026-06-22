"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, LEVELS } from "@/types/gamification";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  label: string;
  xp: number;
  streak: number;
  level: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries || [];
  } catch {
    return [];
  }
}

function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  for (const l of LEVELS) {
    if (totalXp >= l.xpRequired) level = l.level;
  }
  return level;
}

export default function AdminGamificationPage() {
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "gamification", "leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 15000,
  });

  const totalUsers = entries.length;
  const totalXpAll = entries.reduce((s, e) => s + e.xp, 0);
  const avgXp = totalUsers > 0 ? Math.round(totalXpAll / totalUsers) : 0;
  const avgStreak =
    totalUsers > 0 ? Math.round(entries.reduce((s, e) => s + e.streak, 0) / totalUsers) : 0;
  const levelDistribution: Record<number, number> = {};
  for (const e of entries) {
    const lvl = calculateLevelFromXp(e.xp);
    levelDistribution[lvl] = (levelDistribution[lvl] || 0) + 1;
  }

  const topUsers = entries.slice(0, 10);

  const achievementStats = ACHIEVEMENTS.map((a) => ({
    ...a,
    earnedCount: 0,
  }));

  return (
    <div className={cn("mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 bg-background p-6")}>
      <div className={cn("flex items-center justify-between")}>
        <h1 className={cn("font-extrabold text-2xl")}>Gamification Admin</h1>
      </div>

      {isError && (
        <div
          className={cn(
            "rounded-card-lg border border-destructive/60 bg-destructive/5 p-4 text-destructive text-sm",
          )}
        >
          Failed to load leaderboard: {error?.message}
        </div>
      )}

      {isLoading && (
        <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4")}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2",
              )}
            >
              <div className={cn("h-20 w-full animate-pulse bg-muted")} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4")}>
            <div
              className={cn(
                "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2",
              )}
            >
              <header className={cn("p-4 pb-2")}>
                <h2 className={cn("font-medium font-sans text-muted-foreground text-sm")}>
                  Total Users
                </h2>
              </header>
              <div className={cn("p-4 pt-0")}>
                <p className={cn("font-extrabold text-3xl")}>{totalUsers}</p>
              </div>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2",
              )}
            >
              <header className={cn("p-4 pb-2")}>
                <h2 className={cn("font-medium font-sans text-muted-foreground text-sm")}>
                  Total XP
                </h2>
              </header>
              <div className={cn("p-4 pt-0")}>
                <p className={cn("font-extrabold text-3xl")}>{totalXpAll.toLocaleString()}</p>
              </div>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2",
              )}
            >
              <header className={cn("p-4 pb-2")}>
                <h2 className={cn("font-medium font-sans text-muted-foreground text-sm")}>
                  Avg XP / User
                </h2>
              </header>
              <div className={cn("p-4 pt-0")}>
                <p className={cn("font-extrabold text-3xl")}>{avgXp.toLocaleString()}</p>
              </div>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2",
              )}
            >
              <header className={cn("p-4 pb-2")}>
                <h2 className={cn("font-medium font-sans text-muted-foreground text-sm")}>
                  Avg Streak
                </h2>
              </header>
              <div className={cn("p-4 pt-0")}>
                <p className={cn("font-extrabold text-3xl")}>{avgStreak}</p>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors",
            )}
          >
            <header className={cn("p-4 pb-2")}>
              <h2 className={cn("font-heading font-medium text-lg")}>Level Distribution</h2>
            </header>
            <div className={cn("flex flex-col gap-2 p-4 pt-0")}>
              {Object.entries(levelDistribution).length === 0 && (
                <p className={cn("text-muted-foreground text-sm")}>No data yet</p>
              )}
              {Object.entries(levelDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => {
                  const levelDef = LEVELS.find((l) => l.level === Number(level));
                  return (
                    <div key={level} className={cn("flex items-center justify-between text-sm")}>
                      <span className={cn("font-medium")}>
                        Lvl {level}: {levelDef?.title || ""}
                      </span>
                      <span className={cn("font-mono")}>
                        {count} user{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors",
            )}
          >
            <header className={cn("p-4 pb-2")}>
              <h2 className={cn("font-heading font-medium text-lg")}>Top Users</h2>
            </header>
            <div className={cn("flex flex-col gap-2 p-4 pt-0")}>
              {topUsers.length === 0 && (
                <p className={cn("text-muted-foreground text-sm")}>No data yet</p>
              )}
              {topUsers.map((user) => (
                <div key={user.userId} className={cn("flex items-center justify-between text-sm")}>
                  <div className={cn("flex items-center gap-2")}>
                    <span className={cn("w-4 font-mono text-muted-foreground")}>#{user.rank}</span>
                    <span className={cn("font-medium")}>{user.label || "Student"}</span>
                    <Badge variant="outline" className={cn("ios-caption-3 font-mono")}>
                      Lvl {user.level}
                    </Badge>
                  </div>
                  <div className={cn("flex items-center gap-3")}>
                    <span className={cn("text-muted-foreground text-xs")}>🔥 {user.streak}</span>
                    <span className={cn("font-mono")}>{user.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors",
            )}
          >
            <header className={cn("p-4 pb-2")}>
              <h2 className={cn("font-heading font-medium text-lg")}>
                All Achievements ({ACHIEVEMENTS.length})
              </h2>
            </header>
            <div className={cn("flex flex-col gap-2 p-4 pt-0")}>
              {achievementStats.map((a) => (
                <div key={a.id} className={cn("flex items-center justify-between text-sm")}>
                  <div className={cn("flex items-center gap-2")}>
                    <span>{a.icon}</span>
                    <span className={cn("font-medium")}>{a.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ios-caption-3 font-mono",
                        a.rarity === "legendary"
                          ? "border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400"
                          : a.rarity === "epic"
                            ? "border-purple-500 text-purple-500 dark:border-purple-400 dark:text-purple-400"
                            : a.rarity === "rare"
                              ? "border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400"
                              : "",
                      )}
                    >
                      {a.rarity}
                    </Badge>
                  </div>
                  <span className={cn("text-muted-foreground text-xs")}>
                    {a.xpReward} XP ({a.category})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
