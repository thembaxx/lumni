"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Copy02Icon from "@hugeicons/core-free-icons/Copy02Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import Lock01Icon from "@hugeicons/core-free-icons/Lock01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import MicOff01Icon from "@hugeicons/core-free-icons/MicOff01Icon";
import Minimize01Icon from "@hugeicons/core-free-icons/Minimize01Icon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ChallengeBanner } from "@/components/study-groups/challenge/challenge-banner";
import { ChallengeLeaderboard } from "@/components/study-groups/challenge/challenge-leaderboard";
import { CreateChallengeDialog } from "@/components/study-groups/challenge/create-challenge-dialog";
import { DiscussionFeed } from "@/components/study-groups/discussion-feed";
import { GroupSettingsDialog } from "@/components/study-groups/group-settings-dialog";
import { LiveSessionBar } from "@/components/study-groups/live-session-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssignCoAdmin,
  useGroupDetail,
  useMuteMember,
  useRemoveCoAdmin,
  useRemoveMember,
  useUnmuteMember,
} from "@/hooks/use-study-groups";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { GroupChallenge, GroupChallengeEntry } from "@/lib/study-groups/challenge-types";

export function GroupDetail() {
  const t = useTranslations();
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { data, isLoading, error } = useGroupDetail(groupId);
  const { user } = useAuth();
  const { mutate: removeMemberAction } = useRemoveMember();
  const { mutate: muteMemberAction } = useMuteMember();
  const { mutate: unmuteMemberAction } = useUnmuteMember();
  const { mutate: assignCoAdminAction } = useAssignCoAdmin();
  const { mutate: removeCoAdminAction } = useRemoveCoAdmin();
  const [copied, setCopied] = useState(false);

  const { data: challengeData } = useQuery<{
    challenge: GroupChallenge;
    entries: GroupChallengeEntry[];
  }>({
    queryKey: ["group-challenge", groupId],
    queryFn: async () =>
      apiFetch<{ challenge: GroupChallenge; entries: GroupChallengeEntry[] }>(
        `/api/study-groups/${groupId}/challenge`,
        {},
      ),
    refetchInterval: 30000,
  });

  const copyInviteCode = () => {
    if (data?.group?.inviteCode) {
      navigator.clipboard.writeText(data.group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-6 py-6">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-6 py-6">
          <Link
            href="/study-groups"
            className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            {t("common.back")}
          </Link>
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <p className="text-lg text-muted-foreground">{t("common.error")}</p>
            <Button variant="outline" asChild>
              <Link href="/study-groups">{t("common.back")}</Link>
            </Button>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const { group, members } = data;

  const userNames: Record<string, string> = {};
  for (const m of members || []) {
    userNames[m.userId] = m.userName || m.userEmail || m.userId;
  }

  const currentMember = members?.find((m) => m.userId === user?.$id);
  const canAdmin = currentMember?.role === "admin" || currentMember?.role === "co-admin";
  const isCreator = user?.$id === group.createdBy;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <Link
          href="/study-groups"
          className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          {t("common.back")}
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-2xl">{group.name}</h1>
            {group.description && <p className="text-muted-foreground">{group.description}</p>}
          </div>
        </div>

        {challengeData && (
          <>
            <ChallengeBanner
              challenge={challengeData.challenge}
              entries={challengeData.entries}
              subjectId={data?.group?.subjectId}
              groupId={groupId}
            />
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Award01Icon} className="size-5" />
                  <h2 className="font-semibold">This Week&apos;s Leaderboard</h2>
                </div>
                <CreateChallengeDialog
                  groupId={groupId}
                  onCreated={() => window.location.reload()}
                />
              </div>
              <ChallengeLeaderboard entries={challengeData.entries} userNames={userNames} />
            </Card>
          </>
        )}

        <LiveSessionBar groupId={groupId} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t("studyGroups.inviteCode")}</h2>
              {canAdmin && <GroupSettingsDialog group={group} />}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                {group.inviteCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <HugeiconsIcon
                  icon={copied ? CheckmarkCircle01Icon : Copy02Icon}
                  className="size-3.5"
                />
                {copied ? t("common.copied") : t("studyGroups.copyCode")}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("studyGroups.createdBy")}: {group.createdBy}
            </p>
            {group.subjectId && (
              <Badge variant="secondary" className="w-fit">
                {group.subjectId}
              </Badge>
            )}
            <Badge variant="outline" className="w-fit">
              {group.visibility === "public" ? t("studyGroups.public") : t("studyGroups.private")}
            </Badge>
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-5" />
              <h2 className="font-semibold">
                {t("studyGroups.membersLabel")} ({members?.length || group.memberCount})
              </h2>
            </div>
            {members && members.length > 0 ? (
              <div className="flex flex-col gap-2">
                {members.map((member) => (
                  <div
                    key={member.$id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {member.userName || member.userEmail || member.userId}
                        </span>
                        {member.isMuted && (
                          <HugeiconsIcon
                            icon={Lock01Icon}
                            className="size-3.5 text-muted-foreground"
                            aria-label={t("studyGroups.muted")}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {member.userEmail && member.userName && (
                          <span className="text-muted-foreground text-xs">{member.userEmail}</span>
                        )}
                        {member.questionsAnswered !== undefined && (
                          <span className="text-muted-foreground text-xs">
                            {member.questionsAnswered} Q
                          </span>
                        )}
                        {member.currentStreak !== undefined && (
                          <span className="text-muted-foreground text-xs">
                            <HugeiconsIcon icon={FireIcon} className="size-3.5" />{" "}
                            {member.currentStreak}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          member.role === "admin"
                            ? "default"
                            : member.role === "co-admin"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {member.role === "co-admin" ? t("studyGroups.coAdmin") : member.role}
                      </Badge>
                      {canAdmin && member.role !== "admin" && member.role !== "co-admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            assignCoAdminAction({
                              groupId: group.$id,
                              memberId: member.$id,
                            })
                          }
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={t("studyGroups.makeCoAdmin")}
                          title={t("studyGroups.makeCoAdmin")}
                        >
                          <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
                        </button>
                      )}
                      {isCreator && member.role === "co-admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            removeCoAdminAction({
                              groupId: group.$id,
                              memberId: member.$id,
                            })
                          }
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={t("studyGroups.removeCoAdmin")}
                          title={t("studyGroups.removeCoAdmin")}
                        >
                          <HugeiconsIcon icon={Minimize01Icon} className="size-3.5" />
                        </button>
                      )}
                      {isCreator &&
                        member.role !== "admin" &&
                        (member.isMuted ? (
                          <button
                            type="button"
                            onClick={() =>
                              unmuteMemberAction({
                                groupId: group.$id,
                                memberId: member.$id,
                              })
                            }
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t("studyGroups.unmuteMember")}
                            title={t("studyGroups.unmuteMember")}
                          >
                            <HugeiconsIcon icon={MicOff01Icon} className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              muteMemberAction({
                                groupId: group.$id,
                                memberId: member.$id,
                              })
                            }
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t("studyGroups.muteMember")}
                            title={t("studyGroups.muteMember")}
                          >
                            <HugeiconsIcon icon={Mic01Icon} className="size-3.5" />
                          </button>
                        ))}
                      {canAdmin && member.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            removeMemberAction({
                              groupId: group.$id,
                              memberId: member.$id,
                            })
                          }
                          className="text-destructive hover:text-destructive/80"
                          aria-label={t("common.remove")}
                        >
                          <HugeiconsIcon icon={Minimize01Icon} className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("studyGroups.empty")}</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Discussions</h2>
          <DiscussionFeed groupId={groupId} />
        </div>
      </div>
    </PageContainer>
  );
}
