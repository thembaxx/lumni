"use client";

import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Bookmark03Icon from "@hugeicons/core-free-icons/Bookmark03Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import VolumeUpIcon from "@hugeicons/core-free-icons/VolumeUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
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
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db";
import { getRandomWord, lookupWord, preCacheCommonWords } from "@/lib/dictionary/service";
import type { DictionaryResult } from "@/lib/dictionary/types";
import { logError } from "@/lib/shared/logger";
import { isWordSaved, removeWord, saveWord } from "@/lib/vocabulary/service";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "af", label: "Afrikaans" },
  { value: "zu", label: "isiZulu" },
  { value: "xh", label: "isiXhosa" },
  { value: "st", label: "Sesotho" },
  { value: "tn", label: "Setswana" },
  { value: "nso", label: "Sepedi" },
  { value: "ts", label: "Xitsonga" },
  { value: "ss", label: "siSwati" },
  { value: "ve", label: "Tshivenda" },
  { value: "nd", label: "isiNdebele" },
];

const LANG_LABELS: Record<string, string> = {};
for (const l of LANGUAGES) {
  LANG_LABELS[l.value] = l.label;
}

export function DictionaryClient() {
  const { user } = useAuth();
  const userId = user?.$id ?? "anonymous";
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);
  const langRef = useRef(language);

  useEffect(() => {
    preCacheCommonWords(dexieDataAccess).catch(() => {
      // background pre-cache failure is non-critical
    });
    try {
      const raw = localStorage.getItem("lumni_dictionary_recent");
      if (raw) setRecentLookups(JSON.parse(raw) as string[]);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    langRef.current = language;
  }, [language]);

  const addRecentLookup = useCallback((word: string) => {
    setRecentLookups((prev) => {
      const next = [word, ...prev.filter((w) => w !== word)].slice(0, 10);
      try {
        localStorage.setItem("lumni_dictionary_recent", JSON.stringify(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  const performLookup = useCallback(
    async (word: string) => {
      if (!word) return;
      setLoading(true);
      setSearched(true);
      try {
        const lang = langRef.current;
        const data = await lookupWord(word, lang);
        setResult(data);
        if (data) {
          addRecentLookup(word);
          if (userId !== "anonymous") {
            const alreadySaved = await isWordSaved(userId, word);
            setSaved(alreadySaved);
          }
        }
      } catch (err) {
        logError("DictionaryClient.search", err);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [userId, addRecentLookup],
  );

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await performLookup(query.trim());
    },
    [query, performLookup],
  );

  const handleRandomWord = useCallback(async () => {
    const word = getRandomWord();
    setQuery(word);
    await performLookup(word);
  }, [performLookup]);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    void audio.play();
  }, []);

  const handleSave = useCallback(async () => {
    if (saving || !result || userId === "anonymous") return;
    setSaving(true);
    try {
      if (saved) {
        await removeWord(userId, result.word);
        setSaved(false);
      } else {
        const def = result.definitions[0]?.definition ?? "";
        const pos = result.definitions[0]?.partOfSpeech;
        await saveWord(userId, result.word, def, langRef.current, "manual", "dictionary", pos);
        setSaved(true);
      }
    } catch (err) {
      logError("DictionaryClient.save", err);
    } finally {
      setSaving(false);
    }
  }, [saving, saved, userId, result]);

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Dictionary</h1>
          <p className="text-muted-foreground text-sm">
            Look up word definitions and save vocabulary for review.
          </p>
        </m.div>

        <div className="grid gap-3 sm:grid-cols-2">
          <WordOfDayCard language={language} />
          <m.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase, delay: 0.1 }
            }
          >
            <Button
              variant="outline"
              className="flex h-full w-full items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-level-1"
              onClick={handleRandomWord}
              disabled={loading}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <HugeiconsIcon icon={RefreshIcon} className="size-4 text-primary" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                  Random Word
                </span>
                <span className="text-foreground/60 text-xs">Discover a new word</span>
              </div>
            </Button>
          </m.div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a word..."
              className="pl-9"
              aria-label="Search dictionary"
            />
          </div>
          <Select
            value={language}
            onValueChange={(v) => {
              if (v) setLanguage(v);
            }}
          >
            <SelectTrigger className="w-36 rounded-full text-xs" aria-label="Select language">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!query.trim() || loading}>
            Search
          </Button>
        </form>

        {recentLookups.length > 0 && !searched && !loading && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Recent:</span>
            {recentLookups.map((w) => (
              <button
                key={w}
                type="button"
                className="rounded-full bg-muted px-2.5 py-1 text-xs transition-colors hover:bg-(--system-accent)/10 hover:text-(--system-accent)"
                onClick={() => {
                  setQuery(w);
                  performLookup(w);
                }}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {!loading && searched && !result && (
            <m.div
              key="not-found"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
            >
              <Card className="rounded-card">
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No definition found for &ldquo;{query}&rdquo;
                  </p>
                </CardContent>
              </Card>
            </m.div>
          )}

          {!loading && result && (
            <m.div
              key={result.word}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
            >
              <Card className="overflow-hidden rounded-card shadow-level-1">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h2 className="font-semibold text-xl">{result.word}</h2>
                      {result.phonetic && (
                        <span className="text-muted-foreground text-sm">{result.phonetic}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.audio && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-full"
                          onClick={() => playAudio(result.audio)}
                          aria-label={`Listen to ${result.word}`}
                        >
                          <HugeiconsIcon icon={VolumeUpIcon} className="size-4" />
                        </Button>
                      )}
                      {userId !== "anonymous" && (
                        <Button
                          variant={saved ? "default" : "outline"}
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <HugeiconsIcon
                            icon={saved ? Bookmark03Icon : Bookmark02Icon}
                            className="size-3.5"
                          />
                          {saved ? "Saved" : "Save Word"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {result.definitions.map((def) => (
                      <div key={def.definition} className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className="bg-(--system-accent)/10 text-(--system-accent)"
                        >
                          {def.partOfSpeech}
                        </Badge>
                        <p className="text-sm leading-relaxed">{def.definition}</p>
                        {def.example && (
                          <p className="text-muted-foreground text-xs italic">
                            &ldquo;{def.example}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {(result.synonyms.length > 0 || result.antonyms.length > 0) && (
                    <div className="flex flex-col gap-2 border-t pt-4">
                      {result.synonyms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground text-xs">Synonyms:</span>
                          {result.synonyms.slice(0, 6).map((s) => (
                            <button
                              key={s}
                              type="button"
                              className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-(--system-accent)/10 hover:text-(--system-accent) focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={() => setQuery(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {result.antonyms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground text-xs">Antonyms:</span>
                          {result.antonyms.slice(0, 6).map((a) => (
                            <button
                              key={a}
                              type="button"
                              className="rounded-full bg-muted px-2 py-0.5 text-xs transition-colors hover:bg-(--system-accent)/10 hover:text-(--system-accent) focus-visible:ring-2 focus-visible:ring-primary"
                              onClick={() => setQuery(a)}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </m.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </div>
  );
}
