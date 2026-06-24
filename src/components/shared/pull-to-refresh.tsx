"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = "",
  ...rest
}: PullToRefreshProps & React.HTMLAttributes<HTMLDivElement>) {
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({ startY: 0, pulling: false });

  const animateY = useCallback((y: number, smooth = false) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition =
      smooth || y > 0 ? "transform 0.3s var(--ease-drawer)" : "none";
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
  }, []);

  const onRefreshEvent = useEffectEvent(onRefresh);
  const animateYEvent = useEffectEvent(animateY);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const g = gestureRef.current;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return;
      g.startY = e.touches[0].clientY;
      g.pulling = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshing) return;
      const diff = e.touches[0].clientY - g.startY;
      if (diff > 4 && el.scrollTop <= 0) {
        g.pulling = true;
        const damped = Math.min(diff * 0.4, 80);
        el.style.transition = "none";
        el.style.transform = `translateY(${damped}px)`;
      } else if (g.pulling && diff <= 4) {
        g.pulling = false;
        animateYEvent(0);
      }
    };

    const onTouchEnd = async () => {
      if (!g.pulling) return;
      g.pulling = false;
      if (el.scrollTop > 0) return;
      const currentPx = parseInt(el.style.transform.match(/(\d+\.?\d*)/)?.[0] ?? "0", 10);
      if (currentPx >= 24) {
        setRefreshing(true);
        el.style.transition = "transform 0.3s var(--ease-drawer)";
        el.style.transform = "translateY(56px)";
        try {
          await onRefreshEvent();
        } finally {
          animateYEvent(0, true);
          setRefreshing(false);
        }
      } else {
        animateYEvent(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [disabled, refreshing]);

  return (
    <div ref={ref} className={className} style={{ overscrollBehaviorY: "contain" }} {...rest}>
      {refreshing && (
        <div className="flex h-14 items-center justify-center" style={{ marginTop: "-3.5rem" }}>
          <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      {children}
    </div>
  );
}
