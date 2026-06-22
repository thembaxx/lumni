"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import SpeakerIcon from "@hugeicons/core-free-icons/SpeakerIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getWordOfDay, lookupWord } from "@/lib/dictionary/service";

interface WordOfDayCardProps {
  language?: string;
}

export function WordOfDayCard({ language = "en" }: WordOfDayCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const word = useMemo(() => getWordOfDay(language), [language]);

  const { data: result, isLoading } = useQuery({
    queryKey: ["word-of-day", word, language],
    queryFn: () => lookupWord(word, language),
    staleTime: 1000 * 60 * 60,
  });

  const playAudio = () => {
    if (!result?.audio) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(result.audio);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  return (
    <Link
      href={`/dictionary?q=${encodeURIComponent(word)}`}
      className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-level-1 transition-[background-color,transform] duration-200 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground/70 text-xs uppercase tracking-wider">
          Word of the Day
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
        </div>
      ) : result ? (
        <>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-lg">{result.word}</span>
            {result.phonetic && (
              <span className="text-muted-foreground text-sm">{result.phonetic}</span>
            )}
            {result.audio && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playAudio();
                }}
                className="ml-auto flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                aria-label="Play pronunciation"
              >
                <HugeiconsIcon icon={SpeakerIcon} className="size-3.5" />
              </button>
            )}
          </div>
          {result.definitions[0] && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs italic">
                {result.definitions[0].partOfSpeech}
              </span>
              <p className="line-clamp-2 text-foreground/80 text-sm leading-relaxed">
                {result.definitions[0].definition}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{word}</p>
      )}
    </Link>
  );
}
