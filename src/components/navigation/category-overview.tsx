"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import type { IconSvgElement } from "@hugeicons/react";
import Atom01Icon from "@hugeicons/core-free-icons/Atom01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import CalculateIcon from "@hugeicons/core-free-icons/CalculateIcon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";

const iconMap: Record<string, IconSvgElement> = {
  Atom01Icon,
  Award01Icon,
  BookOpen01Icon,
  BookOpen02Icon,
  Bookmark02Icon,
  CalculateIcon,
  CalculatorIcon,
  Calendar01Icon,
  Chat01Icon,
  CompassIcon,
  DatabaseIcon,
  File01Icon,
  FlashIcon,
  Mic01Icon,
  Note01Icon,
  Quiz01Icon,
  Search01Icon,
  Settings01Icon,
  Share07Icon,
  Target01Icon,
  Upload01Icon,
};

interface CategoryItem {
  label: string;
  description: string;
  href: string;
  icon: string;
}

interface CategoryOverviewProps {
  title: string;
  items: CategoryItem[];
}

export function CategoryOverview({ title, items }: CategoryOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="ios-title-1 font-bold text-foreground tracking-tight">{title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">Choose a section to get started</p>
      </m.div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const Icon = iconMap[item.icon];
          return (
            <m.div
              key={item.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={item.href}
                className="group flex items-start gap-4 rounded-card-lg border border-border/80 bg-card p-5 shadow-level-2 transition-[box-shadow,scale] duration-200 hover:shadow-level-3 active:scale-[0.96]"
              >
                {Icon && (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-system-accent/10 transition-colors duration-200 group-hover:bg-system-accent/20">
                    <HugeiconsIcon icon={Icon} className="size-6 text-system-accent" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{item.label}</h3>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Link>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
