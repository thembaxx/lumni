"use client";

import Book01Icon from "@hugeicons/core-free-icons/Book01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useEasterEgg } from "@/lib/shared/easter-egg-context";
import { cn } from "@/lib/utils";
import { SubjectsDrawer } from "../drawers/subjects-drawer";
import { SearchResults } from "./search-results";

export function SearchWidget() {
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { trigger } = useEasterEgg();

  useEffect(() => {
    if (query.toLowerCase().includes("42")) {
      trigger("retro");
    }
  }, [query, trigger]);

  return (
    <m.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl border border-border/30 bg-secondary/60 p-3 transition-[border-color,box-shadow] duration-300",
        isFocused && "border-primary/30 shadow-level-2",
      )}
    >
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ask anything about your studies..."
          aria-label="Ask anything about your studies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border-0 bg-transparent p-0 text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary"
        />
        <SubjectsDrawer>
          <button
            type="button"
            className="rounded-lg bg-muted/60 p-1.5 transition-[background-color,transform] hover:bg-muted press-scale focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Browse subjects"
          >
            <HugeiconsIcon
              icon={Book01Icon}
              size={16}
              className="text-muted-foreground"
              data-icon
            />
          </button>
        </SubjectsDrawer>
      </div>
      <SearchResults query={query} />
    </m.div>
  );
}
