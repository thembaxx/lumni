"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import Download03Icon from "@hugeicons/core-free-icons/Download03Icon";
import FilterIcon from "@hugeicons/core-free-icons/FilterIcon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Upload04Icon from "@hugeicons/core-free-icons/Upload04Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { flashcardEngine } from "@/lib/flashcard-engine";
import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import { downloadCSV, parseCSV } from "@/lib/utils/flashcard-import-export";

type BrowseFiltersState = {
  search: string;
  subjectFilter: string;
  page: number;
};

type BrowseFiltersAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SUBJECT_FILTER"; payload: string }
  | { type: "SET_PAGE"; payload: number };

function filtersReducer(
  state: BrowseFiltersState,
  action: BrowseFiltersAction,
): BrowseFiltersState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload, page: 0 };
    case "SET_SUBJECT_FILTER":
      return { ...state, subjectFilter: action.payload, page: 0 };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    default:
      return state;
  }
}

type LoadingStatus = "idle" | "loading" | "importing";

export function FlashcardBrowseClient() {
  const t = useTranslations();
  const [filters, dispatch] = useReducer(filtersReducer, {
    search: "",
    subjectFilter: "all",
    page: 0,
  });
  const { search, subjectFilter, page } = filters;
  const [status, setStatus] = useState<LoadingStatus>("loading");
  const [cards, setCards] = useState<FlashcardSM2[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const nowRef = useRef<number | null>(null);
  if (nowRef.current === null) nowRef.current = Date.now();
  const now = nowRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  const loadCards = useCallback(async () => {
    setStatus("loading");
    try {
      const all = await flashcardEngine.getAll(subjectFilter !== "all" ? subjectFilter : undefined);
      const filtered = search
        ? all.filter(
            (c) =>
              c.front.toLowerCase().includes(search.toLowerCase()) ||
              c.back.toLowerCase().includes(search.toLowerCase()),
          )
        : all;
      setCards(filtered);
      const uniqueSubjects = [...new Set(all.map((c) => c.subject))].toSorted();
      setSubjects(uniqueSubjects);
    } finally {
      setStatus("idle");
    }
  }, [search, subjectFilter]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleDelete = async (id: string) => {
    await flashcardEngine.delete(id);
    loadCards();
  };

  const handleExport = () => {
    downloadCSV(cards);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("importing");
    try {
      const text = await file.text();
      const imported = parseCSV(text);
      await Promise.all(
        imported.map((card) =>
          flashcardEngine.create(card.front, card.back, card.subject, card.topic),
        ),
      );
      loadCards();
    } finally {
      setStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const paginated = cards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(cards.length / PAGE_SIZE);

  return (
    <PageContainer className="py-8">
      <h1 className="mb-6 font-semibold text-2xl">{t("flashcards.browseTitle")}</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("flashcards.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              dispatch({ type: "SET_SEARCH", payload: e.target.value });
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={subjectFilter}
          onValueChange={(v) => dispatch({ type: "SET_SUBJECT_FILTER", payload: v ?? "all" })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("flashcards.allSubjects")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("flashcards.allSubjects")}</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadCards}>
          <HugeiconsIcon icon={FilterIcon} className="mr-1 size-4" />
          {t("flashcards.refresh")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={cards.length === 0}>
          <HugeiconsIcon icon={Download03Icon} className="mr-1 size-4" />
          {t("flashcards.exportCsv")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "importing"}
        >
          <HugeiconsIcon icon={Upload04Icon} className="mr-1 size-4" />
          {status === "importing" ? t("flashcards.importing") : t("flashcards.importCsv")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
          aria-label={t("flashcards.importCsvAria")}
        />
      </div>

      {status === "loading" ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
              key={i}
              className="h-24 rounded-xl"
            />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {search || subjectFilter !== "all"
            ? t("flashcards.noMatchFilters")
            : t("flashcards.browseEmpty")}
        </div>
      ) : (
        <>
          <p className="mb-4 text-muted-foreground text-sm">
            {t("flashcards.cardCount", { count: cards.length })}
          </p>
          <div className="flex flex-col gap-3">
            {paginated.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 line-clamp-2 font-medium">{card.front}</div>
                      <div className="line-clamp-2 text-muted-foreground text-sm">{card.back}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="ios-caption-3 bg-primary/10 text-primary"
                        >
                          {card.subject}
                        </Badge>
                        {card.topic && (
                          <Badge
                            variant="outline"
                            className="ios-caption-3 bg-secondary/30 text-muted-foreground"
                          >
                            {card.topic}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="ios-caption-3 bg-muted/30 text-muted-foreground"
                        >
                          {t("flashcards.ease")}: {card.easeFactor.toFixed(1)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="ios-caption-3 bg-muted/30 text-muted-foreground"
                        >
                          {t("flashcards.interval")}: {card.interval}d
                        </Badge>
                        {card.nextReview > now ? (
                          <Badge
                            variant="outline"
                            className="ios-caption-3 bg-green-500/10 text-green-600 dark:bg-green-400/10 dark:text-green-300"
                          >
                            {t("flashcards.dueLabel")}{" "}
                            {new Date(card.nextReview).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="ios-caption-3 bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
                          >
                            {t("flashcards.overdue")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                      aria-label={t("flashcards.deleteCard")}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => dispatch({ type: "SET_PAGE", payload: page - 1 })}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-1 size-4" />{" "}
                {t("flashcards.previous")}
              </Button>
              <span className="text-muted-foreground text-sm">
                {t("flashcards.pageInfo", { page: page + 1, totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => dispatch({ type: "SET_PAGE", payload: page + 1 })}
              >
                {t("flashcards.next")}{" "}
                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1 size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
