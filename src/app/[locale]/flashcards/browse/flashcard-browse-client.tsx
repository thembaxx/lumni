"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import Download03Icon from "@hugeicons/core-free-icons/Download03Icon";
import FilterIcon from "@hugeicons/core-free-icons/FilterIcon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Upload04Icon from "@hugeicons/core-free-icons/Upload04Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { motionEase } from "@/lib/utils/animation";
import { PageContainer } from "@/components/layout/page-container";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
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
  const prefersReducedMotion = useReducedMotion();
  const [filters, dispatch] = useReducer(filtersReducer, {
    search: "",
    subjectFilter: "all",
    page: 0,
  });
  const { search, subjectFilter, page } = filters;
  const [status, setStatus] = useState<LoadingStatus>("loading");
  const [allCards, setAllCards] = useState<FlashcardSM2[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const nowRef = useRef<number | null>(null);
  if (nowRef.current === null) nowRef.current = Date.now();
  const now = nowRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  const doLoadCards = useCallback(async () => {
    const all = await flashcardEngine.getAll(subjectFilter !== "all" ? subjectFilter : undefined);
    setAllCards(all);
    const uniqueSubjects = [...new Set(all.map((c) => c.subject))].toSorted();
    setSubjects(uniqueSubjects);
  }, [subjectFilter]);

  const loadCards = useCallback(async () => {
    setStatus("loading");
    try {
      await doLoadCards();
    } finally {
      setStatus("idle");
    }
  }, [doLoadCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const cards = useMemo(() => {
    if (!search) return allCards;
    const q = search.toLowerCase();
    return allCards.filter(
      (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q),
    );
  }, [allCards, search]);

  const handleDelete = async (id: string) => {
    await flashcardEngine.delete(id);
    loadCards();
  };

  const handleExport = () => {
    downloadCSV(cards);
  };

  const doImport = useCallback(
    async (file: File) => {
      const text = await file.text();
      const imported = parseCSV(text);
      await Promise.all(
        imported.map((card) =>
          flashcardEngine.create(card.front, card.back, card.subject, card.topic),
        ),
      );
      loadCards();
    },
    [loadCards],
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("importing");
    try {
      await doImport(file);
    } finally {
      setStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const paginated = cards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(cards.length / PAGE_SIZE);

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">
            {t("flashcards.browseTitle")}
          </h1>
        </m.div>

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
            <HugeiconsIcon icon={FilterIcon} data-icon="inline-start" />
            {t("flashcards.refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={cards.length === 0}>
            <HugeiconsIcon icon={Download03Icon} data-icon="inline-start" />
            {t("flashcards.exportCsv")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === "importing"}
          >
            <HugeiconsIcon icon={Upload04Icon} data-icon="inline-start" />
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
                        <div className="line-clamp-2 text-muted-foreground text-sm">
                          {card.back}
                        </div>
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
                              className="ios-caption-3 bg-success/10 text-success"
                            >
                              {t("flashcards.dueLabel")}{" "}
                              {new Date(card.nextReview).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="ios-caption-3 bg-warning/10 text-warning"
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
                        <HugeiconsIcon icon={Delete02Icon} data-icon className="text-destructive" />
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
                  <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />{" "}
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
                  <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
}
