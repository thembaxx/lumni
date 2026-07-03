"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Minimize01Icon from "@hugeicons/core-free-icons/Minimize01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteGroup, useGroupDetail } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import type { StudyGroup } from "@/lib/study-groups/types";
import { Link } from "@/i18n/navigation";
import { GroupSettingsDialog } from "./group-settings-dialog";

interface Props {
  group: StudyGroup;
}

export function GroupAdminPanel({ group }: Props) {
  const t = useTranslations();
  const { user } = useAuth();
  const { data, isLoading } = useGroupDetail(group.$id);
  const { mutate: deleteGroup } = useDeleteGroup();
  const isCreator = user?.$id === group.createdBy;
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return null;

  const members = data?.members ?? [];
  const mutedMembers = members.filter((m) => m.isMuted);
  const coAdmins = members.filter((m) => m.role === "co-admin");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/study-groups/${group.$id}`} className="font-semibold hover:text-primary">
            {group.name}
          </Link>
          <Badge variant="secondary" className="text-xs">
            {group.memberCount} members
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <GroupSettingsDialog group={group} />
          <Link href={`/study-groups/${group.$id}`}>
            <Button variant="ghost" size="icon" aria-label="Open group">
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {coAdmins.length > 0 && (
          <Card className="flex flex-col gap-2 p-3">
            <span className="font-medium text-xs text-muted-foreground">
              {t("studyGroups.coAdmin")} ({coAdmins.length})
            </span>
            {coAdmins.map((m) => (
              <span key={m.$id} className="text-sm">
                {m.userName || m.userEmail || m.userId}
              </span>
            ))}
          </Card>
        )}

        {mutedMembers.length > 0 && (
          <Card className="flex flex-col gap-2 p-3">
            <span className="font-medium text-xs text-muted-foreground">
              {t("studyGroups.muted")} ({mutedMembers.length})
            </span>
            {mutedMembers.map((m) => (
              <span key={m.$id} className="text-sm">
                {m.userName || m.userEmail || m.userId}
              </span>
            ))}
          </Card>
        )}
      </div>

      {isCreator && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger>
            <Button variant="destructive" size="sm" className="w-fit">
              <HugeiconsIcon icon={Minimize01Icon} className="size-4" />
              {t("studyGroups.deleteGroup")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("studyGroups.confirmDeleteGroup")}</DialogTitle>
              <DialogDescription>
                {t("studyGroups.typeNameToConfirm")}: <strong>{group.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteGroup(group.$id);
                  setDeleteOpen(false);
                }}
              >
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
