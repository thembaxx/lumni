"use client";

import Book01Icon from "@hugeicons/core-free-icons/Book01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { SearchResults } from "@/components/dashboard/search/search-results";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const { push } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-border/30 border-b p-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask anything about your studies…"
            aria-label="Search your study materials"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent p-0 text-base text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />
          <SubjectsDrawer>
            <button
              type="button"
              className="rounded-lg bg-muted/60 p-1.5 transition-colors hover:bg-muted"
              aria-label="Browse subjects"
            >
              <HugeiconsIcon icon={Book01Icon} size={16} className="text-muted-foreground" />
            </button>
          </SubjectsDrawer>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SearchResults query={query} onClose={() => push("/dashboard")} />
      </div>
    </div>
  );
}
