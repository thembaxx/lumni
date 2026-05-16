"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { m } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";
import { appConfig } from "../../app.config";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-[--system-background] grid grid-cols-12 gap-0">
      <m.div
        className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: iOSEase }}
      >
        <main className="space-y-6 max-w-md text-left">
          <m.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: iOSEase, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-secondary blur-xl" />
            <div className="relative w-24 h-24 rounded-full bg-secondary/60 flex items-center justify-center">
              <AnimatedIcon name="page-404" className="w-16 h-16" />
            </div>
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: iOSEase, delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="ios-title-2 text-[--system-text-primary]">
              Page not found
            </h2>
            <p className="ios-callout text-[--system-text-secondary]">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: iOSEase, delay: 0.3 }}
          >
            <Link href="/">
              <Button className="bg-[--system-accent] text-background hover:bg-[--system-accent]/80">
                Back to {appConfig.name}
              </Button>
            </Link>
          </m.div>
        </main>
      </m.div>

      <div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/5 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
        </div>
      </div>
    </div>
  );
}
