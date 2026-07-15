"use client";

import Bookmark01Icon from "@hugeicons/core-free-icons/Bookmark01Icon";
import Delete01Icon from "@hugeicons/core-free-icons/Delete01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { motionEase } from "@/lib/utils/animation";
import { SpotlightCard } from "@/components/shared/motion-primitives";

export function BookmarksClient() {
  const { bookmarks, removeBookmark } = useBookmarks();

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <LocalDataNotice
          page="bookmarks"
          description="Your bookmarked questions are saved on this device. Sign in to keep them across all your devices."
        />
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">
            Bookmarked Questions
          </h1>
        </m.div>

        {bookmarks.length === 0 ? (
          <SpotlightCard className="rounded-card-lg" radius={260}>
            <Card>
              <CardContent className="flex flex-col gap-1 p-8 text-center">
                <HugeiconsIcon
                  icon={Bookmark01Icon}
                  className="mx-auto mb-3 size-8 text-muted-foreground/40"
                />
                <p className="font-semibold text-base">No bookmarks yet</p>
                <p className="text-muted-foreground text-sm">
                  Bookmark questions during quizzes to save them here.
                </p>
              </CardContent>
            </Card>
          </SpotlightCard>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              {bookmarks.length} saved question
              {bookmarks.length !== 1 ? "s" : ""}
            </p>
            {bookmarks.map((bm) => (
              <SpotlightCard key={bm.id} className="rounded-card-lg" radius={260}>
                <Card key={bm.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{bm.subject}</Badge>
                        {bm.topic && (
                          <Badge variant="secondary" className="text-xs">
                            {bm.topic}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 min-h-11 min-w-11"
                        onClick={() => removeBookmark(bm.id)}
                        aria-label="Remove bookmark"
                      >
                        <HugeiconsIcon
                          icon={Delete01Icon}
                          className="size-4 text-muted-foreground"
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="font-semibold text-base">
                      <MarkdownRenderer content={bm.questionText} />
                    </CardTitle>
                    {bm.note && (
                      <div className="mt-3 rounded-lg bg-muted/30 p-3">
                        <p className="mb-1 font-medium text-muted-foreground text-xs">Note</p>
                        <p className="overflow-wrap-anywhere text-sm">{bm.note}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </SpotlightCard>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
