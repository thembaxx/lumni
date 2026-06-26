"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import BookBookmark01Icon from "@hugeicons/core-free-icons/BookBookmark01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import ChartBarIncreasingIcon from "@hugeicons/core-free-icons/ChartBarIncreasingIcon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import World from "@hugeicons/core-free-icons/GlobeIcon";
import NoteIcon from "@hugeicons/core-free-icons/NoteIcon";
import StarSquareIcon from "@hugeicons/core-free-icons/StarSquareIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { SearchResultItem } from "@/lib/services/search-service";
import { searchAll, searchWeb } from "@/lib/services/search-service";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  SearchResultItem["type"],
  { label: string; icon: typeof File01Icon; color: string }
> = {
  question: {
    label: "Question",
    icon: File01Icon,
    color: "text-(--system-accent)",
  },
  flashcard: {
    label: "Flashcard",
    icon: StarSquareIcon,
    color: "text-warning",
  },
  "wrong-answer": {
    label: "Mistake",
    icon: AlertCircleIcon,
    color: "text-destructive",
  },
  note: {
    label: "Note",
    icon: NoteIcon,
    color: "text-success",
  },
  "study-set": {
    label: "Study Set",
    icon: BookOpen01Icon,
    color: "text-info",
  },
  exam: {
    label: "Exam",
    icon: BookOpen01Icon,
    color: "text-warning",
  },
  "quiz-attempt": {
    label: "Quiz Attempt",
    icon: Clock01Icon,
    color: "text-info",
  },
  "exam-session": {
    label: "Exam Session",
    icon: File02Icon,
    color: "text-destructive",
  },
  progress: {
    label: "Progress",
    icon: ChartBarIncreasingIcon,
    color: "text-success",
  },
  web: { label: "Web", icon: World, color: "text-muted-foreground" },
  "study-guide": {
    label: "Study Guide",
    icon: BookOpen01Icon,
    color: "text-info",
  },
  dictionary: {
    label: "Dictionary",
    icon: BookOpen01Icon,
    color: "text-info",
  },
  story: {
    label: "Story",
    icon: BookOpen01Icon,
    color: "text-(--system-accent)",
  },
  lesson: {
    label: "Lesson",
    icon: BookOpen01Icon,
    color: "text-info",
  },
  vocabulary: {
    label: "Vocabulary",
    icon: BookBookmark01Icon,
    color: "text-success",
  },
};

interface SearchResultsProps {
  query: string;
  onClose?: () => void;
  className?: string;
}

type SearchState = {
  results: SearchResultItem[];
  loading: boolean;
  selectedIndex: number;
};

type SearchAction =
  | { type: "CLEAR" }
  | { type: "START_LOADING" }
  | { type: "LOAD_RESULTS"; items: SearchResultItem[] }
  | { type: "SELECT_NEXT" }
  | { type: "SELECT_PREV" };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "CLEAR":
      return { results: [], loading: false, selectedIndex: 0 };
    case "START_LOADING":
      return { ...state, loading: true };
    case "LOAD_RESULTS":
      return {
        results: action.items,
        loading: false,
        selectedIndex: 0,
      };
    case "SELECT_NEXT":
      return {
        ...state,
        selectedIndex: Math.min(state.selectedIndex + 1, state.results.length - 1),
      };
    case "SELECT_PREV":
      return {
        ...state,
        selectedIndex: Math.max(state.selectedIndex - 1, 0),
      };
  }
}

export function SearchResults({ query, onClose, className }: SearchResultsProps) {
  const [searchState, dispatch] = useReducer(searchReducer, {
    results: [],
    loading: false,
    selectedIndex: 0,
  });
  const { results, loading, selectedIndex } = searchState;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      dispatch({ type: "CLEAR" });
      return;
    }

    dispatch({ type: "START_LOADING" });
    const timer = setTimeout(async () => {
      try {
        const [local, web] = await Promise.all([searchAll(query), searchWeb(query)]);
        const merged = [...local, ...web];
        dispatch({ type: "LOAD_RESULTS", items: merged });
      } catch (err) {
        logError("search-results.search", err);
        dispatch({ type: "LOAD_RESULTS", items: [] });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        dispatch({ type: "SELECT_NEXT" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        dispatch({ type: "SELECT_PREV" });
      }
    },
    [results.length],
  );

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!query || query.length < 2) return null;

  return (
    <div
      className={cn("flex", "flex-col", "mt-2 gap-1", className)}
      onKeyDown={handleKeyDown}
      role="listbox"
      tabIndex={0}
    >
      {loading && <p className="px-1 text-muted-foreground text-xs">Searching…</p>}
      {!loading && results.length === 0 && (
        <p className="px-1 text-muted-foreground text-xs">
          No results for "{query}". Try searching for a topic or subject name.
        </p>
      )}
      <div ref={listRef} className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
        {results.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <button
              type="button"
              key={item.id}
              onClick={onClose}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors",
                i === selectedIndex ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <div className="mt-0.5 shrink-0">
                <HugeiconsIcon icon={config.icon} size={16} className={cn(config.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{item.title}</p>
                <p className="mt-0.5 truncate text-muted-foreground text-xs">{item.snippet}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="secondary" className="px-1.5 py-0 text-(--fs-caption-3)">
                  {config.label}
                </Badge>
                {item.subject && (
                  <span className="max-w-16 truncate font-mono text-(--fs-caption-3) text-muted-foreground">
                    {item.subject}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
