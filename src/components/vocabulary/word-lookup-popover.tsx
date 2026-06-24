"use client";

import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Bookmark03Icon from "@hugeicons/core-free-icons/Bookmark03Icon";
import VolumeUpIcon from "@hugeicons/core-free-icons/VolumeUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { PopoverContent } from "@/components/ui/popover-content";
import { PopoverTrigger } from "@/components/ui/popover-trigger";
import { lookupWord } from "@/lib/dictionary/service";
import type { DictionaryResult } from "@/lib/dictionary/types";
import { createFlashcardFromVocabulary } from "@/lib/integration/service";
import { logError } from "@/lib/shared/logger";
import { isWordSaved, removeWord, saveWord } from "@/lib/vocabulary/service";

interface WordLookupPopoverProps {
  word: string;
  language?: string;
  userId?: string;
  children: React.ReactNode;
}

export function WordLookupPopover({
  word,
  language = "en",
  userId = "anonymous",
  children,
}: WordLookupPopoverProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && result === null) {
        setLoading(true);
        try {
          const data = await lookupWord(word, language);
          setResult(data);
          const alreadySaved = await isWordSaved(userId, word);
          setSaved(alreadySaved);
        } catch (err) {
          logError("WordLookupPopover.lookup", err);
          setResult(null);
        } finally {
          setLoading(false);
        }
      }
    },
    [word, language, userId, result],
  );

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    void audio.play();
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await removeWord(userId, word);
        setSaved(false);
      } else {
        const def = result?.definitions[0]?.definition ?? "";
        const pos = result?.definitions[0]?.partOfSpeech;
        await saveWord(userId, word, def, language, "manual", "dictionary", pos);
        await createFlashcardFromVocabulary(userId, word, def, language);
        setSaved(true);
      }
    } catch (err) {
      logError("WordLookupPopover.save", err);
    } finally {
      setSaving(false);
    }
  }, [saving, saved, userId, word, language, result]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <span className="cursor-pointer underline decoration-dotted underline-offset-2 transition-colors hover:text-(--system-accent)">
            {children}
          </span>
        }
      />
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Looking up...
            </div>
          ) : result ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base">{result.word}</span>
                {result.phonetic && (
                  <span className="text-muted-foreground text-xs">{result.phonetic}</span>
                )}
                {result.audio && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-7 shrink-0 rounded-full"
                    onClick={() => playAudio(result.audio)}
                    aria-label={`Listen to ${result.word}`}
                  >
                    <HugeiconsIcon icon={VolumeUpIcon} className="size-3.5" />
                  </Button>
                )}
              </div>
              {result.definitions.slice(0, 2).map((def) => (
                <div key={def.definition} className="flex flex-col gap-1">
                  <span className="w-fit rounded-full bg-(--system-accent)/10 px-2 py-0.5 font-medium text-(--system-accent) text-(--fs-caption-3)">
                    {def.partOfSpeech}
                  </span>
                  <p className="text-sm leading-relaxed">{def.definition}</p>
                  {def.example && (
                    <p className="text-muted-foreground text-xs italic">
                      &ldquo;{def.example}&rdquo;
                    </p>
                  )}
                </div>
              ))}
              <Button
                variant={saved ? "default" : "outline"}
                size="sm"
                className="mt-1 w-full rounded-full text-xs"
                onClick={handleSave}
                disabled={saving}
              >
                <HugeiconsIcon
                  icon={saved ? Bookmark03Icon : Bookmark02Icon}
                  className="size-3.5"
                />
                {saved ? "Saved for Review" : "Save & Review"}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No definition found for &ldquo;{word}&rdquo;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
