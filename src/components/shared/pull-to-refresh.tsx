"use client";

import { animate } from "motion";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { haptics } from "@/lib/utils/haptics";
import { springPresets } from "@/lib/utils/spring-presets";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const VELOCITY_WINDOW = 3;
const VELOCITY_MS = 100;
const DAMPING_FACTOR = 0.4;
const MAX_PULL = 80;
const COMMIT_THRESHOLD = 24;
const DISPLACEMENT_THRESHOLD = 4;
const HOLD_Y = 56;

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = "",
  ...rest
}: PullToRefreshProps & React.HTMLAttributes<HTMLDivElement>) {
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({
    startY: 0,
    pointerId: -1,
    history: [] as Array<{ y: number; t: number }>,
    tracking: false,
  });

  const springRef = useRef<{ stop: () => void } | null>(null);

  const animateY = useCallback((y: number, useSpring = false) => {
    const el = ref.current;
    if (!el) return;

    // Cancel any in-flight spring to avoid conflicts
    springRef.current?.stop();
    springRef.current = null;

    if (useSpring && y === 0) {
      // Spring back with interruptible physics — allows re-grab mid-animation
      const currentY = parseFloat(el.style.transform.match(/(\d+\.?\d*)/)?.[0] ?? "0");
      if (currentY > 0) {
        const animation = animate(currentY, 0, {
          ...springPresets.appleSheet,
          onUpdate: (latest: number) => {
            el.style.transform = latest > 0.5 ? `translateY(${latest}px)` : "";
          },
          onComplete: () => {
            el.style.transform = "";
          },
        });
        springRef.current = animation;
      }
    } else {
      el.style.transform = y > 0 ? `translateY(${y}px)` : "";
    }
  }, []);

  const onRefreshEvent = useEffectEvent(onRefresh);
  const animateYEvent = useEffectEvent(animateY);

  function getVelocityFromHistory(history: Array<{ y: number; t: number }>): number {
    if (history.length < 2) return 0;
    const recent = history.slice(-VELOCITY_WINDOW);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.y - first.y) / dt) * 1000;
  }

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const g = gestureRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (el.scrollTop > 0) return;
      g.startY = e.clientY;
      g.pointerId = e.pointerId;
      g.tracking = true;
      g.history = [{ y: e.clientY, t: performance.now() }];
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!g.tracking || refreshing) return;
      g.history.push({ y: e.clientY, t: performance.now() });
      const cutoff = performance.now() - VELOCITY_MS;
      while (g.history.length > 0 && g.history[0].t < cutoff) {
        g.history.shift();
      }

      const diff = e.clientY - g.startY;
      if (diff > DISPLACEMENT_THRESHOLD && el.scrollTop <= 0) {
        const damped = Math.min(diff * DAMPING_FACTOR, MAX_PULL);
        el.style.transition = "none";
        el.style.transform = `translateY(${damped}px)`;
      } else if (diff <= DISPLACEMENT_THRESHOLD) {
        g.tracking = false;
        animateYEvent(0);
      }
    };

    const onPointerUp = async (_e: PointerEvent) => {
      if (!g.tracking) return;
      g.tracking = false;

      const currentPx = parseInt(el.style.transform.match(/(\d+\.?\d*)/)?.[0] ?? "0", 10);
      const velocity = getVelocityFromHistory(g.history);

      if (currentPx >= COMMIT_THRESHOLD || velocity > 200) {
        haptics.medium();
        setRefreshing(true);
        el.style.transition = "none";
        el.style.transform = `translateY(${HOLD_Y}px)`;
        onRefreshEvent().finally(() => {
          animateYEvent(0, true);
          setRefreshing(false);
        });
      } else {
        animateYEvent(0, true);
      }
    };

    const onPointerCancel = (_e: PointerEvent) => {
      g.tracking = false;
      animateYEvent(0);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [disabled, refreshing]);

  return (
    <div ref={ref} className={className} style={{ overscrollBehaviorY: "contain" }} {...rest}>
      {refreshing && (
        <div className="flex h-14 items-center justify-center" style={{ marginTop: "-3.5rem" }}>
          <div className="size-6 animate-spin rounded-full border-2 border-(--system-accent) border-t-transparent" />
        </div>
      )}
      {children}
    </div>
  );
}
