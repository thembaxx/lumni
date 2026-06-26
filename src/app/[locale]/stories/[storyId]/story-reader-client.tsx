"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Lightning from "@hugeicons/core-free-icons/FlashIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ListenToLesson } from "@/components/listen-to-lesson";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ComprehensionQuestionCard } from "@/components/stories/comprehension-question-card";
import { StoryProgressBar } from "@/components/stories/story-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveVocabularyButton } from "@/components/vocabulary/save-vocabulary-button";
import { WordLookupPopover } from "@/components/vocabulary/word-lookup-popover";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { trackComprehensionResult } from "@/lib/competency-engine";
import { offlineDB } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";
import { cacheStory, generateComprehensionQuestions } from "@/lib/stories";
import { loadStoryContent } from "@/lib/stories/story-data";
import type { Story, StoryQuestion } from "@/lib/stories/types";

const COMPLETION_THRESHOLD = 90;
const SAVE_DEBOUNCE_MS = 2000;
const TIME_TRACK_INTERVAL_MS = 30000;

function getLangCode(languageId: string): string {
  const map: Record<string, string> = {
    "english-home-language": "en",
    "afrikaans-home-language": "af",
    "isi-zulu-home-language": "zu",
    "isi-xhosa-home-language": "xh",
    "sesotho-home-language": "st",
    "setswana-home-language": "tn",
    "sepedi-home-language": "nso",
    "xitsonga-home-language": "ts",
    "siswati-home-language": "ss",
    "tshivenda-home-language": "ve",
    "isi-ndebele-home-language": "nd",
  };
  return map[languageId] ?? "en";
}

export function StoryReaderClient() {
  const { storyId } = useParams<{ storyId: string }>();
  const { back } = useRouter();
  const { push } = useNavigationDirection();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<StoryQuestion[] | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [allGraded, setAllGraded] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [completed, setCompleted] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressLoadedRef = useRef(false);
  const progressIdRef = useRef<number | undefined>(undefined);
  const scrollPercentRef = useRef(0);
  const completedRef = useRef(false);
  const timeSpentRef = useRef(0);

  const userId = user?.$id ?? "anonymous";

  useEffect(() => {
    if (!storyId) return;
    loadStoryContent(storyId).then((s) => {
      setStory(s);
      setLoading(false);
      if (s) {
        cacheStory(storyId, s).catch((err: unknown) => logError("story-reader.cacheStory", err));
      }
    });
  }, [storyId]);

  useEffect(() => {
    if (!storyId || !userId || loading || progressLoadedRef.current) return;
    progressLoadedRef.current = true;
    offlineDB.storyProgress
      .where("[userId+storyId]")
      .equals([userId, storyId])
      .first()
      .then((record) => {
        if (record) {
          progressIdRef.current = record.id;
          scrollPercentRef.current = record.scrollPercent;
          completedRef.current = record.completed;
          timeSpentRef.current = record.timeSpentSeconds;
          setScrollPercent(record.scrollPercent);
          setCompleted(record.completed);
        }
      })
      .catch((err: unknown) => logError("story-reader.loadProgress", err));
  }, [storyId, userId, loading]);

  const saveProgress = useCallback(
    (pct: number, done: boolean, seconds: number) => {
      if (!userId || !storyId) return;
      const id = progressIdRef.current;
      if (id !== undefined) {
        offlineDB.storyProgress
          .update(id, {
            scrollPercent: pct,
            completed: done,
            lastReadAt: Date.now(),
            timeSpentSeconds: seconds,
          })
          .catch((err: unknown) => logError("story-reader.saveProgress", err));
      } else {
        offlineDB.storyProgress
          .add({
            userId,
            storyId,
            scrollPercent: pct,
            completed: done,
            lastReadAt: Date.now(),
            timeSpentSeconds: seconds,
          })
          .then((newId) => {
            progressIdRef.current = newId;
          })
          .catch((err: unknown) => logError("story-reader.saveProgress", err));
      }
    },
    [userId, storyId],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      scrollPercentRef.current = pct;
      setScrollPercent(pct);

      if (pct >= COMPLETION_THRESHOLD) {
        completedRef.current = true;
        setCompleted(true);
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveProgress(scrollPercentRef.current, completedRef.current, timeSpentRef.current);
      }, SAVE_DEBOUNCE_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveProgress]);

  useEffect(() => {
    timeRef.current = setInterval(() => {
      timeSpentRef.current += 30;
    }, TIME_TRACK_INTERVAL_MS);
    return () => {
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      const finalPct = completedRef.current ? 100 : scrollPercentRef.current;
      saveProgress(finalPct, completedRef.current, timeSpentRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveProgress]);

  useEffect(() => {
    if (completedRef.current) return;
    if (scrollPercent >= COMPLETION_THRESHOLD) {
      completedRef.current = true;
      setCompleted(true);
      saveProgress(100, true, timeSpentRef.current);
    }
  }, [scrollPercent, saveProgress]);

  const handleLoadQuestions = useCallback(async () => {
    if (!story) return;
    setQuestionsLoading(true);
    try {
      const qs = await generateComprehensionQuestions(story);
      setQuestions(qs);
      setShowQuestions(true);
      setScores(new Map());
      setAllGraded(false);
    } finally {
      setQuestionsLoading(false);
    }
  }, [story]);

  const handleGraded = useCallback((questionId: string, score: number) => {
    setScores((prev) => {
      const next = new Map(prev);
      next.set(questionId, score);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const allDone = questions.every((q) => scores.has(q.id));
    if (allDone && !allGraded) {
      setAllGraded(true);
      const allScores = questions.map((q) => scores.get(q.id) ?? 0);
      trackComprehensionResult(
        userId,
        storyId as string,
        story?.language ?? "english",
        allScores,
      ).catch((err: unknown) => logError("trackComprehensionResult", err));
    }
  }, [questions, scores, allGraded, userId, storyId, story?.language]);

  const overallScore =
    scores.size > 0 ? Math.round([...scores.values()].reduce((a, b) => a + b, 0) / scores.size) : 0;

  if (loading) {
    return (
      <PageContainer className="gap-4 pt-8">
        <Skeleton className="h-8 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-40 rounded-2xl" />
        <Skeleton className="mt-4 h-96 w-full rounded-3xl" />
      </PageContainer>
    );
  }

  if (!story) {
    return (
      <PageContainer className="flex flex-col items-center gap-3 py-16 text-center">
        <HugeiconsIcon icon={BookOpen01Icon} className="size-12 text-muted-foreground/30" />
        <p className="font-semibold text-lg">Story not found</p>
        <p className="text-muted-foreground text-sm">
          This story might have been removed or is not available yet. Check the story link or browse
          available stories.
        </p>
        <Button variant="outline" onClick={() => back()} className="mt-2 rounded-full">
          Go back
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-6 pt-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => back()}
          className="rounded-full"
          aria-label="Go back to stories"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Back
        </Button>
      </div>

      <FadeIn direction="up" distance={16} duration={0.4}>
        <Card className="overflow-hidden rounded-3xl shadow-level-1">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full text-xs">
                {story.language}
              </Badge>
              <ListenToLesson text={story.content} lang={getLangCode(story.languageId)} />
              {story.gradeLevel && (
                <Badge variant="outline" className="rounded-full text-xs">
                  Grade {story.gradeLevel}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">
                {story.wordCount.toLocaleString()} words
              </span>
              {story.readTimeMinutes && (
                <span className="text-muted-foreground text-xs">
                  {story.readTimeMinutes} min read
                </span>
              )}
              {story.license && (
                <Badge
                  variant="outline"
                  className="rounded-full text-(--fs-caption-3) uppercase tracking-wide"
                >
                  {story.license === "public-domain" ? "Public Domain" : story.license}
                </Badge>
              )}
            </div>
            <CardTitle className="mt-3 font-extrabold text-2xl tracking-tight">
              {story.title}
            </CardTitle>
            <p className="text-muted-foreground text-sm">by {story.author}</p>
            <div className="mt-3">
              <StoryProgressBar scrollPercent={scrollPercent} completed={completed} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-5 pt-0">
            <div className="text-base/7 leading-[1.75]">
              <MarkdownRenderer content={story.content} />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {story.vocabulary && story.vocabulary.length > 0 && (
        <FadeIn direction="up" distance={16} duration={0.4}>
          <Card className="overflow-hidden rounded-3xl shadow-level-1">
            <CardHeader>
              <CardTitle className="font-extrabold text-lg">Vocabulary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {story.vocabulary.map((v) => (
                <div
                  key={v.term}
                  className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3"
                >
                  <div className="flex flex-col">
                    <WordLookupPopover word={v.term} language={story.language}>
                      <span className="font-semibold text-sm">{v.term}</span>
                    </WordLookupPopover>
                    <span className="text-muted-foreground text-xs">{v.definition}</span>
                  </div>
                  <SaveVocabularyButton
                    word={v.term}
                    definition={v.definition}
                    language={story.language}
                    sourceType="story"
                    sourceId={story.id}
                    userId={userId}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <div className="flex flex-col gap-3">
        {!showQuestions ? (
          <Button
            variant="default"
            size="lg"
            onClick={handleLoadQuestions}
            disabled={questionsLoading}
            className="self-start rounded-full"
          >
            <HugeiconsIcon icon={Lightning} className="size-5" />
            {questionsLoading ? "Generating questions..." : "Practice Comprehension"}
          </Button>
        ) : (
          <FadeIn direction="up" distance={16} duration={0.4} className="flex flex-col gap-4">
            <h2 className="font-extrabold text-lg tracking-tight">Comprehension Questions</h2>

            {questions && questions.length > 0 ? (
              questions.map((q, i) => (
                <ComprehensionQuestionCard
                  key={q.id}
                  question={q}
                  questionNumber={i + 1}
                  onGraded={(s) => handleGraded(q.id, s)}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No questions could be generated for this story.
              </p>
            )}

            {allGraded && (
              <FadeIn direction="up" distance={16} duration={0.4}>
                <Card className="overflow-hidden rounded-3xl border-info/20 bg-info/5 shadow-level-1">
                  <CardHeader>
                    <CardTitle className="font-extrabold text-lg">Results</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-5 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-card p-4 text-center">
                        <div className="font-extrabold text-3xl tabular-nums">{overallScore}%</div>
                        <div className="mt-1 text-muted-foreground text-xs">Overall Score</div>
                      </div>
                      <div className="rounded-2xl bg-card p-4 text-center">
                        <div className="font-extrabold text-3xl tabular-nums">
                          {scores.size}/{questions?.length ?? 0}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">Questions Answered</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => push(`/stories`)}
                      >
                        More Stories
                      </Button>
                      {overallScore < 50 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() =>
                              push(`/stories?lang=${encodeURIComponent(story.language)}&level=easy`)
                            }
                          >
                            Try an Easier Story
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() =>
                              push(
                                `/dictionary?q=${encodeURIComponent(story.vocabulary[0]?.term ?? "")}`,
                              )
                            }
                          >
                            Review Vocabulary
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() =>
                          push(`/quiz?subject=${encodeURIComponent(story.language)}&count=5`)
                        }
                      >
                        Practice Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </FadeIn>
        )}
      </div>
    </PageContainer>
  );
}
