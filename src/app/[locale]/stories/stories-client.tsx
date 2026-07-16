"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import VolumeUpIcon from "@hugeicons/core-free-icons/VolumeUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { StoryProgressRecord } from "@/lib/db/schema";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { logError } from "@/lib/shared/logger";
import { cacheAllStories, generateAudioForAllStories } from "@/lib/stories/service";
import type { StoryMeta } from "@/lib/stories/story-data";
import { getAllStoryMetas, getLanguageLabel } from "@/lib/stories/story-data";

const LANG_OPTIONS = [
  { id: "english-home-language", label: "English", code: "en" },
  { id: "afrikaans-home-language", label: "Afrikaans", code: "af" },
  { id: "isi-zulu-home-language", label: "isiZulu", code: "zu" },
  { id: "isi-xhosa-home-language", label: "isiXhosa", code: "xh" },
  { id: "sesotho-home-language", label: "Sesotho", code: "st" },
  { id: "setswana-home-language", label: "Setswana", code: "tn" },
  { id: "sepedi-home-language", label: "Sepedi", code: "nso" },
  { id: "xitsonga-home-language", label: "Xitsonga", code: "ts" },
  { id: "siswati-home-language", label: "siSwati", code: "ss" },
  { id: "tshivenda-home-language", label: "Tshivenda", code: "ve" },
  { id: "isi-ndebele-home-language", label: "isiNdebele", code: "nd" },
];

const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const SUBJECTS = [
  "Mathematics",
  "English",
  "Afrikaans",
  "isiZulu",
  "Life Sciences",
  "Physical Sciences",
  "History",
  "Geography",
];

export function StoriesClient() {
  const { push } = useRouter();
  const { user } = useAuth();
  const [selectedLang, setSelectedLang] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [stories, setStories] = useState<StoryMeta[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, StoryProgressRecord>>(new Map());
  const [genOpen, setGenOpen] = useState(false);
  const [genLanguage, setGenLanguage] = useState("english-home-language");
  const [genGrade, setGenGrade] = useState("4");
  const [genTopic, setGenTopic] = useState("");
  const [genSubject, setGenSubject] = useState("English");
  const [genLoading, setGenLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const userId = user?.$id;

  const doGenerate = useCallback(async () => {
    const langOpt = LANG_OPTIONS.find((l) => l.id === genLanguage);
    const res = await fetch("/api/engine/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langOpt?.label ?? "English",
        languageId: genLanguage,
        gradeLevel: genGrade,
        topic: genTopic.trim(),
        subject: genSubject,
      }),
    });
    const data = await res.json();
    if (data.story) {
      const meta: StoryMeta = {
        id: data.story.id,
        title: data.story.title,
        author: data.story.author,
        language: data.story.language,
        languageId: data.story.languageId,
        gradeLevel: data.story.gradeLevel,
        wordCount: data.story.wordCount,
        subjects: data.story.subjects,
        source: "ai-generated",
        sourceUrl: "",
        topics: data.story.topics,
        readTimeMinutes: data.story.readTimeMinutes,
        license: "ai-generated",
      };
      setStories((prev) => [meta, ...prev]);
      push(`/stories/${data.story.id}`);
      setGenOpen(false);
      setGenTopic("");
    }
  }, [genLanguage, genGrade, genTopic, genSubject, push]);

  const handleGenerate = useCallback(async () => {
    if (!genTopic.trim()) return;
    setGenLoading(true);
    try {
      await doGenerate();
    } catch (err) {
      logError("stories-client.generateStory", err);
    } finally {
      setGenLoading(false);
    }
  }, [genTopic, doGenerate]);

  useEffect(() => {
    getAllStoryMetas().then((all) => {
      setStories(all);
      const langs = [...new Set(all.map((s) => s.languageId))];
      setLanguages(langs);
    });
    cacheAllStories().catch((err) => logError("stories-client.cacheAll", err));
  }, []);

  useEffect(() => {
    if (!userId || stories.length === 0) return;
    const storyIds = new Set(stories.map((s) => s.id));
    dexieDataAccess.storyProgress
      .where("userId")
      .equals(userId)
      .toArray()
      .then((records) => {
        const map = new Map<string, StoryProgressRecord>();
        for (const r of records) {
          if (storyIds.has(r.storyId)) {
            map.set(r.storyId, r);
          }
        }
        setProgressMap(map);
      })
      .catch((err) => logError("stories-client.loadProgress", err));
  }, [userId, stories]);

  const filtered = stories.filter((s) => {
    if (selectedLang !== "all" && s.languageId !== selectedLang) return false;
    if (selectedGrade !== "all" && !s.gradeLevel?.includes(selectedGrade)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchAuthor = s.author.toLowerCase().includes(q);
      const matchTopic = s.topics?.some((t) => t.toLowerCase().includes(q)) ?? false;
      if (!matchTitle && !matchAuthor && !matchTopic) return false;
    }
    return true;
  });

  return (
    <PageContainer className="gap-6 pt-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">Stories</h1>
        <p className="text-muted-foreground text-sm">
          Read short stories and practice reading comprehension
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or topic..."
            className="rounded-2xl pl-9 text-xs"
            aria-label="Search stories"
          />
        </div>
        <Select
          value={selectedGrade}
          onValueChange={(v) => {
            if (v) setSelectedGrade(v);
          }}
        >
          <SelectTrigger className="w-32 rounded-full text-xs" aria-label="Filter by grade">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All grades
            </SelectItem>
            {["R", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
              <SelectItem key={g} value={g} className="text-xs">
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAudioLoading(true);
            generateAudioForAllStories().finally(() => setAudioLoading(false));
          }}
          disabled={audioLoading}
          className="rounded-full text-xs"
          aria-label="Generate audio for all stories"
        >
          <HugeiconsIcon icon={VolumeUpIcon} className="size-3.5" />
          {audioLoading ? "Generating Audio..." : "Generate Audio"}
        </Button>
      </div>

      {languages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={selectedLang === "all" ? "default" : "outline"}
            className="cursor-pointer rounded-full px-3 text-xs"
            onClick={() => setSelectedLang("all")}
          >
            All
          </Badge>
          {languages.map((lang) => (
            <Badge
              key={lang}
              variant={selectedLang === lang ? "default" : "outline"}
              className="cursor-pointer rounded-full px-3 text-xs"
              onClick={() => setSelectedLang(lang)}
            >
              {getLanguageLabel(lang)}
            </Badge>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenOpen(true)}
            className="ml-auto rounded-full text-xs"
          >
            <HugeiconsIcon icon={MagicWand01Icon} className="size-3.5" />
            Generate Story
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-12 text-muted-foreground/30" />
          <p className="font-semibold text-lg">No stories yet</p>
          <p className="text-muted-foreground text-sm">Stories are being added. Check back soon!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((story, i) => {
          const progress = progressMap.get(story.id);
          const isCompleted = progress?.completed ?? false;
          const scrollPct = progress?.scrollPercent ?? 0;
          const isPartial = !isCompleted && scrollPct > 0;

          return (
            <FadeIn key={story.id} direction="up" distance={16} duration={0.4} delay={i * 0.05}>
              <Card
                className="cursor-pointer overflow-hidden rounded-3xl shadow-level-1 transition-[background-color] duration-300 hover:bg-muted/50 active:scale-[0.96]"
                onClick={() => push(`/stories/${story.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Read ${story.title}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-bold text-lg leading-snug">{story.title}</CardTitle>
                    {isCompleted && (
                      <Badge
                        variant="default"
                        className="shrink-0 rounded-full bg-success/15 text-(--fs-caption-3) text-success"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 p-5 pt-0">
                  <p className="text-muted-foreground text-sm">{story.author}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {story.language}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {story.wordCount.toLocaleString()} words
                    </span>
                    <span className="text-muted-foreground text-xs">Grade {story.gradeLevel}</span>
                  </div>
                  {isPartial && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start rounded-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        push(`/stories/${story.id}`);
                      }}
                    >
                      Continue ({scrollPct}%)
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate a Story</DialogTitle>
            <DialogDescription>
              Create an original story using AI for any subject, grade, and language.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-(--fs-caption-3) font-medium text-muted-foreground">
                Language
              </span>
              <Select
                value={genLanguage}
                onValueChange={(v) => {
                  if (v) setGenLanguage(v);
                }}
              >
                <SelectTrigger className="rounded-full text-xs" aria-label="Language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-(--fs-caption-3) font-medium text-muted-foreground">Grade</span>
              <Select
                value={genGrade}
                onValueChange={(v) => {
                  if (v) setGenGrade(v);
                }}
              >
                <SelectTrigger className="rounded-full text-xs" aria-label="Grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-(--fs-caption-3) font-medium text-muted-foreground">
                Subject
              </span>
              <Select
                value={genSubject}
                onValueChange={(v) => {
                  if (v) setGenSubject(v);
                }}
              >
                <SelectTrigger className="rounded-full text-xs" aria-label="Subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-(--fs-caption-3) font-medium text-muted-foreground">
                Topic / Theme
              </span>
              <Input
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. The Water Cycle, Nelson Mandela, Fractions"
                className="rounded-2xl text-xs"
                aria-label="Story topic"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!genTopic.trim() || genLoading}
              className="self-end rounded-full"
            >
              {genLoading ? "Generating..." : "Generate Story"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
