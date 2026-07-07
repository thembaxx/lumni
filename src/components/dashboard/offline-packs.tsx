"use client";

import CloudDownloadIcon from "@hugeicons/core-free-icons/CloudDownloadIcon";
import CloudOffIcon from "@hugeicons/core-free-icons/CloudOffIcon";
import FileDownloadIcon from "@hugeicons/core-free-icons/FileDownloadIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuizPacks } from "@/hooks/use-quiz-packs";
import { useSubjects } from "@/hooks/use-subjects";
import { OfflinePackCard } from "@/components/dashboard/parts/offline-pack-card";
import { StorageRing } from "@/components/dashboard/parts/storage-ring";

export function OfflinePackManager() {
  const { packs, generating, storageBytes, storageLimit, generate, remove, playPack } =
    useQuizPacks();
  const { data: subjectsData } = useSubjects();
  const subjects = subjectsData?.subjects ?? [];
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questionCount, setQuestionCount] = useState("10");

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    await generate(selectedSubject, null, Number.parseInt(questionCount, 10) || 10);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-(--system-accent)/10">
            <HugeiconsIcon icon={FileDownloadIcon} className="size-5 text-(--system-accent)" />
          </div>
          <div className="min-w-0">
            <CardTitle className="font-extrabold text-base tracking-tight">
              Offline Study Packs
            </CardTitle>
            <p className="text-muted-foreground text-xs leading-tight">
              Study anywhere, no internet needed
            </p>
          </div>
        </div>
        <StorageRing used={storageBytes} limit={storageLimit} />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedSubject}
            onValueChange={(value: string | null) => setSelectedSubject(value ?? "")}
          >
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {(subjects ?? []).map((s: { name: string; code: string }) => (
                <SelectItem key={s.code} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={5}
            max={30}
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className="h-9 w-16 text-sm"
            placeholder="10"
          />
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || !selectedSubject}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={CloudDownloadIcon} data-icon="inline-start" />
            {generating ? "Generating\u2026" : "Download"}
          </Button>
        </div>

        <div className="h-px bg-border/60" />

        {packs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40">
              <HugeiconsIcon icon={CloudOffIcon} className="size-6 text-muted-foreground/60" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm text-muted-foreground">No packs yet</p>
              <p className="max-w-xs text-muted-foreground/60 text-xs leading-relaxed">
                Pick a subject and questions count above, then download your first offline pack.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {packs.map((pack) => (
              <OfflinePackCard key={pack.id} pack={pack} onPlay={playPack} onRemove={remove} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
