"use client";

import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Button } from "@/components/ui/button";

function Preloader({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <m.div
      className="fixed inset-0 z-modal flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-foreground">
        <span className="font-extrabold text-2xl text-background">L</span>
      </div>
      <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-foreground" />
      </div>
    </m.div>
  );
}

export function AdminPageClient() {
  const router = useRouter();
  const [isAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("admin_session");
  });
  const [showPreloader, setShowPreloader] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSeed = useCallback(async () => {
    setIsSeeding(true);
    setSeedStatus("idle");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setSeedStatus(data.success ? "success" : "error");
    } catch {
      setSeedStatus("error");
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedStatus("idle"), 3000);
    }
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth/verify");
      return;
    }
    setShowPreloader(false);
  }, [isAuthenticated, router]);

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  return (
    <AnimatePresence initial={false}>
      <m.div
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="relative min-h-dvh"
      >
        <div className="fixed right-6 bottom-6 z-modal active:scale-[0.96] transition-transform">
          <Button
            size="icon-lg"
            variant={
              seedStatus === "success"
                ? "secondary"
                : seedStatus === "error"
                  ? "destructive"
                  : "default"
            }
            onClick={handleSeed}
            disabled={isSeeding}
            className="size-14 rounded-full shadow-level-2 shadow-shadow/20"
            title="Seed Database"
            aria-label="Seed Database"
          >
            {isSeeding ? (
              <HugeiconsIcon icon={RadialIcon} className="size-5 animate-spin" />
            ) : (
              <HugeiconsIcon icon={DatabaseIcon} className="size-5" />
            )}
          </Button>
        </div>
        <AdminDashboard />
      </m.div>
    </AnimatePresence>
  );
}
