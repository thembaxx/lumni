"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SearchResults } from "@/components/dashboard/search/search-results";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchPageClient() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <PageContainer className="gap-6 pt-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-extrabold text-2xl tracking-tight">Search</h1>
        <p className="text-muted-foreground text-sm">
          Search across questions, flashcards, notes, stories, dictionary, and more
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border/30 bg-secondary/60 p-4 transition-[border-color,box-shadow] duration-300",
          isFocused && "border-(--system-accent)/30 ring-2 ring-(--system-accent)/20",
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
            className="border-0 bg-transparent p-0 text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />
        </div>
      </div>

      {query.length >= 2 && <SearchResults query={query} className="mt-0" />}
    </PageContainer>
  );
}
