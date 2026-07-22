"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { motionEase } from "@/lib/utils/animation";

interface CardConfig {
  icon: typeof BrainIcon;
  titleKey: string;
  descKey: string;
  image: string;
  accent: string;
  colSpan?: string;
  large?: boolean;
  panorama?: boolean;
}

const cards: CardConfig[] = [
  {
    icon: BrainIcon,
    titleKey: "featureAIPractice",
    descKey: "featureAIPracticeDesc",
    image: "https://picsum.photos/seed/ai-study/800/800",
    colSpan: "lg:col-span-2 lg:row-span-2",
    accent: "text-chart-2",
    large: true,
  },
  {
    icon: BookOpen01Icon,
    titleKey: "featurePastPapers",
    descKey: "featurePastPapersDesc",
    image: "https://picsum.photos/seed/past-papers/400/400",
    accent: "text-chart-4",
  },
  {
    icon: Target01Icon,
    titleKey: "featurePlanner",
    descKey: "featurePlannerDesc",
    image: "https://picsum.photos/seed/study-plan/400/400",
    accent: "text-primary",
  },
  {
    icon: GlobeIcon,
    titleKey: "featureOffline",
    descKey: "featureOfflineDesc",
    image: "https://picsum.photos/seed/offline/400/400",
    accent: "text-chart-3",
  },
  {
    icon: ChartUpIcon,
    titleKey: "featureTracking",
    descKey: "featureTrackingDesc",
    image: "https://picsum.photos/seed/progress-dash/1600/400",
    colSpan: "lg:col-span-4",
    accent: "text-chart-2",
    panorama: true,
  },
];

function BentoCard({
  icon,
  titleKey,
  descKey,
  image,
  accent,
  colSpan,
  large,
  panorama,
  delay,
}: {
  icon: typeof BrainIcon;
  titleKey: string;
  descKey: string;
  image: string;
  accent: string;
  colSpan?: string;
  large?: boolean;
  panorama?: boolean;
  delay: number;
}) {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: prefersReducedMotion ? 0 : delay,
        duration: 0.6,
        ease: motionEase,
      }}
      className={colSpan ?? ""}
    >
      <div className="group relative h-full min-h-48 overflow-hidden rounded-card-lg border border-border/30 bg-card shadow-level-1 transition-[box-shadow,background-color,border-color] duration-500 hover:shadow-level-3">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-15 mix-blend-luminosity transition-transform duration-700 group-hover:scale-110 img-outline"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div
          className={cn(
            "absolute inset-0",
            panorama
              ? "bg-gradient-to-t from-card/95 via-card/60 to-card/30"
              : "bg-gradient-to-br from-card/90 via-card/60 to-card/40",
          )}
        />
        <div
          className={cn(
            "relative flex flex-col gap-3",
            large ? "justify-end p-6 md:p-8" : "p-5",
            "h-full",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-(--system-accent-alpha-10) transition-transform duration-300 group-hoverable:scale-110",
              large ? "size-12" : "size-10",
              accent,
            )}
          >
            <HugeiconsIcon icon={icon} className={cn(large ? "size-6" : "size-5")} />
          </div>
          <h3
            className={cn(
              "font-bold text-foreground tracking-tight",
              large ? "text-2xl" : "text-base",
            )}
          >
            {t(titleKey)}
          </h3>
          <p
            className={cn(
              "max-w-md text-sm leading-relaxed text-muted-foreground",
              !large && "text-xs",
            )}
          >
            {t(descKey)}
          </p>
        </div>
      </div>
    </m.div>
  );
}

import { cn } from "@/lib/utils";

export function FeaturesGrid() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-chart-4/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-14 flex flex-col gap-3"
        >
          <div className="flex h-1 w-10 rounded-full bg-primary" />
          <h2 className="text-3xl font-extrabold text-foreground text-balance tracking-tight md:text-4xl">
            {t("featuresHeading")}
          </h2>
          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            {t("featuresSubheading")}
          </p>
        </m.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-flow-dense lg:grid-cols-4">
          {cards.map((card, i) => (
            <BentoCard
              key={card.titleKey}
              icon={card.icon}
              titleKey={card.titleKey}
              descKey={card.descKey}
              image={card.image}
              accent={card.accent}
              colSpan={card.colSpan}
              large={card.large}
              panorama={card.panorama}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
