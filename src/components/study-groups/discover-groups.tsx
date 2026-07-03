"use client";

import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import TeamWorkIcon from "@hugeicons/core-free-icons/TeamWorkIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscoverGroups, useJoinGroup } from "@/hooks/use-study-groups";
import { Link } from "@/i18n/navigation";
import { Input } from "../ui/input";

const COMMON_SUBJECTS = [
  { id: "mathematics", label: "Mathematics" },
  { id: "physical-sciences", label: "Physical Sciences" },
  { id: "life-sciences", label: "Life Sciences" },
  { id: "accounting", label: "Accounting" },
  { id: "geography", label: "Geography" },
  { id: "english", label: "English" },
  { id: "afrikaans", label: "Afrikaans" },
  { id: "history", label: "History" },
  { id: "business-studies", label: "Business Studies" },
  { id: "economics", label: "Economics" },
  { id: "cat", label: "CAT" },
  { id: "life-orientation", label: "Life Orientation" },
];

export function DiscoverGroups() {
  const t = useTranslations();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const effectiveSubject = subjectFilter && subjectFilter !== "all" ? subjectFilter : undefined;
  const { data: groups, isLoading } = useDiscoverGroups({
    subjectId: effectiveSubject,
    search: search || undefined,
  });
  const joinGroup = useJoinGroup();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("studyGroups.searchGroups")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label={t("studyGroups.searchGroups")}
          />
        </div>
        <Select
          value={subjectFilter}
          onValueChange={(v: string | null) => setSubjectFilter(v ?? "")}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("studyGroups.selectSubject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("studyGroups.selectSubject")}</SelectItem>
            {COMMON_SUBJECTS.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-32" />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.$id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <Link
                  href={`/study-groups/${group.$id}`}
                  className="font-semibold hover:text-primary"
                >
                  {group.name}
                </Link>
              </div>
              {group.description && (
                <p className="line-clamp-2 text-muted-foreground text-sm">{group.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {group.subjectId && <Badge variant="secondary">{group.subjectId}</Badge>}
                  <span className="text-muted-foreground text-xs">{group.memberCount} members</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => joinGroup.mutate(group.inviteCode)}
                  disabled={joinGroup.isPending}
                >
                  {t("studyGroups.join")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <HugeiconsIcon icon={TeamWorkIcon} className="size-10 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">No public groups found</p>
          <p className="text-muted-foreground text-sm">Try a different search or subject filter</p>
        </Card>
      )}
    </div>
  );
}
