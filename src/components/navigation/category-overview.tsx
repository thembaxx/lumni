"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";

const iconMap: Record<string, IconSvgElement> = {
  Quiz01Icon,
  FlashIcon,
  BookOpen01Icon,
  Mic01Icon,
  File01Icon,
  Calendar01Icon,
  Target01Icon,
  Chat01Icon,
  CompassIcon,
  Search01Icon,
  Upload01Icon,
  Share07Icon,
  CalculatorIcon,
  DatabaseIcon,
  Bookmark02Icon,
  Settings01Icon,
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
      <div>
        <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">{title}</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">Choose a section to get started</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.href}
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
          );
        })}
      </div>
    </div>
  );
}
