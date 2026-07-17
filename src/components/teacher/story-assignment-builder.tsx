"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import FolderLibraryIcon from "@hugeicons/core-free-icons/FolderLibraryIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";
import type { StoryMeta } from "@/lib/stories/types";
import { getAllStoryMetas, getLanguageLabel } from "@/lib/stories/story-data";

interface StoryAssignmentBuilderProps extends React.ComponentProps<typeof Card> {
  onAssign: (storyIds: string[], dueDate?: string) => void;
}

export function StoryAssignmentBuilder({
  onAssign,
  className,
  ...props
}: StoryAssignmentBuilderProps) {
  const [stories, setStories] = useState<StoryMeta[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [today] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    getAllStoryMetas()
      .then((result) => {
        setStories(result);
        setFetchError(false);
      })
      .catch((err) => {
        logError("StoryAssignmentBuilder.loadStories", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStory = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const selectedStories = stories.filter((s) => selected.includes(s.id));

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={FolderLibraryIcon} size={20} className="text-primary" />
          Story Assignment Builder
        </CardTitle>
        <CardDescription>Select stories to assign as reading homework.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Command className="rounded-lg border">
          <CommandInput
            aria-label="Search stories"
            placeholder="Search stories by title or language..."
          />
          <CommandList>
            <CommandEmpty>No stories found.</CommandEmpty>
            <CommandGroup>
              {stories.map((story) => (
                <CommandItem
                  key={story.id}
                  value={`${story.title} ${story.language} ${story.topics?.join(" ")}`}
                  onSelect={() => toggleStory(story.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-4 shrink-0 rounded-sm border",
                        selected.includes(story.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{story.title}</span>
                      <span className="truncate text-(--fs-caption-3) text-muted-foreground">
                        {getLanguageLabel(story.languageId)} · Grade {story.gradeLevel} ·{" "}
                        {story.wordCount} words
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {selectedStories.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1">
              {selectedStories.map((s) => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleStory(s.id)}
                >
                  {s.title} ×
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="story-due-date" className="text-muted-foreground text-xs">
                Due date (optional):
              </label>
              <input
                id="story-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-lg border bg-background px-3 text-base"
                min={today}
              />
            </div>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={selected.length === 0} className="w-full" />}>
            <HugeiconsIcon icon={BookOpen01Icon} size={16} />
            Assign Stories ({selected.length})
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Reading Assignment</DialogTitle>
              <DialogDescription>
                This will assign {selected.length} stor{selected.length > 1 ? "ies" : "y"} for
                reading to all students in your class.
                {dueDate && (
                  <>
                    <br />
                    Due by: {new Date(dueDate).toLocaleDateString()}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onAssign(selected, dueDate || undefined);
                    setSelected([]);
                    setDueDate("");
                    setOpen(false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
