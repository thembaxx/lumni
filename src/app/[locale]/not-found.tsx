"use client";

import { Suspense } from "react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";
import { appConfig } from "../../../app.config";

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}

function NotFoundContent() {
  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-(--system-background)">
      <FadeIn
        direction="up"
        distance={12}
        className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7"
      >
        <main className="flex max-w-md flex-col gap-6 text-left">
          <m.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: iOSEase, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-secondary blur-xl" />
            <div className="relative flex size-24 items-center justify-center rounded-full bg-secondary/60">
              <AnimatedIcon name="page-404" className="size-16" />
            </div>
          </m.div>
          <FadeIn direction="up" distance={8} delay={0.2} className="flex flex-col gap-2">
            <h2 className="ios-title-2 text-(--system-text-primary)">Page not found</h2>
            <p className="ios-callout text-(--system-text-secondary)">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </FadeIn>
          <FadeIn direction="up" distance={8} delay={0.3}>
            <Button
              asChild
              className="bg-(--system-accent) text-background hover:bg-(--system-accent)/80"
            >
              <Link href="/">Back to {appConfig.name}</Link>
            </Button>
          </FadeIn>
        </main>
      </FadeIn>

      <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
        <div className="absolute inset-0 bg-gradient-to-br from-(--system-accent)/5 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-(--system-accent)/10 blur-2xl" />
        </div>
      </div>
    </div>
  );
}
