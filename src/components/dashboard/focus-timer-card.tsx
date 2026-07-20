"use client";

import MinusSignFreeIcons from "@hugeicons/core-free-icons/MinusSignIcon";
import PauseFreeIcons from "@hugeicons/core-free-icons/PauseIcon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import PlusSignFreeIcons from "@hugeicons/core-free-icons/PlusSignIcon";
import RotateClockwiseFreeIcons from "@hugeicons/core-free-icons/RotateClockwiseIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { useInterval } from "@/hooks/use-interval";
import { cn } from "@/lib/utils";

const DEFAULT_TIME = 25 * 60;
const MAX_TIME = 60 * 60;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FocusTimerCard() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(DEFAULT_TIME);

  const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  useEffect(() => {
    if (isRunning && timeLeft <= 0) {
      setIsRunning(false);
    }
  }, [isRunning, timeLeft]);

  const tick = useCallback(() => {
    setTimeLeft((prev) => prev - 1);
  }, []);

  useInterval(tick, isRunning && timeLeft > 0 ? 1000 : null);

  const handleStart = () => {
    if (timeLeft === 0) setTimeLeft(initialTime);
    setIsRunning(true);
  };

  const handleStop = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
    setInitialTime(DEFAULT_TIME);
  };

  const handleMinusFive = () => {
    const newTime = Math.max(60, timeLeft - 5 * 60);
    setTimeLeft(newTime);
    if (!isRunning) setInitialTime(newTime);
  };

  const handleAddFive = () => {
    const newTime = Math.min(MAX_TIME, timeLeft + 5 * 60);
    setTimeLeft(newTime);
    if (!isRunning) setInitialTime(newTime);
  };

  return (
    <Card className="overflow-hidden rounded-xl">
      <CardHeader>
        <CardTitle className="font-semibold text-xs">Focus Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <RadialChart value={progress} size={80} color="var(--system-accent)" className="shrink-0">
            <span className="ios-caption-2 font-bold font-mono tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </span>
          </RadialChart>
          <div>
            <p className="text-muted-foreground text-xs">
              {isRunning ? "Running…" : timeLeft === 0 ? "Time's up!" : "Paused"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleMinusFive}
            disabled={isRunning || timeLeft <= 60}
            className="relative size-8 rounded-full after:absolute after:-inset-2 press-scale"
            aria-label="Subtract 5 minutes"
          >
            <HugeiconsIcon icon={MinusSignFreeIcons} data-icon="inline-start" />
          </Button>

          <Button
            variant={isRunning ? "secondary" : "default"}
            size="icon-sm"
            onClick={isRunning ? handleStop : handleStart}
            className={cn(
              "size-10 rounded-full press-scale",
              !isRunning && "bg-system-accent hover:bg-system-accent/90",
            )}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <HugeiconsIcon icon={PauseFreeIcons} data-icon="inline-start" />
            ) : (
              <HugeiconsIcon icon={PlayFreeIcons} data-icon="inline-start" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleAddFive}
            disabled={isRunning || timeLeft >= MAX_TIME}
            className="relative size-8 rounded-full after:absolute after:-inset-2 press-scale"
            aria-label="Add 5 minutes"
          >
            <HugeiconsIcon icon={PlusSignFreeIcons} data-icon="inline-start" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            className="relative size-8 rounded-full text-muted-foreground after:absolute after:-inset-2 press-scale"
            aria-label="Reset timer"
          >
            <HugeiconsIcon icon={RotateClockwiseFreeIcons} data-icon="inline-start" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
