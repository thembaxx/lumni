"use client";

import Edit01Icon from "@hugeicons/core-free-icons/Edit01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateGroup } from "@/hooks/use-study-groups";
import type { StudyGroup } from "@/lib/study-groups/types";

interface Props {
  group: StudyGroup;
}

export function GroupSettingsDialog({ group }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [visibility, setVisibility] = useState(group.visibility ?? "private");
  const { mutate: updateGroup, isPending } = useUpdateGroup();
  const hasChanges =
    name !== group.name ||
    description !== (group.description ?? "") ||
    visibility !== (group.visibility ?? "private");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hasChanges) return;
    updateGroup(
      {
        groupId: group.$id,
        updates: {
          name: name.trim() !== group.name ? name.trim() : undefined,
          description:
            description.trim() !== (group.description ?? "")
              ? description.trim() || undefined
              : undefined,
          visibility: visibility !== (group.visibility ?? "private") ? visibility : undefined,
        },
      },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("studyGroups.settings")}
        >
          <HugeiconsIcon icon={Edit01Icon} className="size-4" data-icon />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("studyGroups.settings")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-name">{t("studyGroups.groupName")}</FieldLabel>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("studyGroups.groupNamePlaceholder")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-desc">{t("studyGroups.description")}</FieldLabel>
              <Textarea
                id="settings-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("studyGroups.descriptionPlaceholder")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-vis">{t("studyGroups.visibility")}</FieldLabel>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as "public" | "private")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("studyGroups.public")}</SelectItem>
                  <SelectItem value="private">{t("studyGroups.private")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={!hasChanges || !name.trim() || isPending}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
