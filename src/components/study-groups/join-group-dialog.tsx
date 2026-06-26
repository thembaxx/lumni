"use client";

import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useJoinGroup } from "@/hooks/use-study-groups";

export function JoinGroupDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { mutate: joinGroup, isPending, error } = useJoinGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    joinGroup(code.trim().toUpperCase(), {
      onSuccess: () => {
        setOpen(false);
        setCode("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline">
          <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
          {t("studyGroups.joinGroup")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("studyGroups.joinGroup")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="code">{t("studyGroups.inviteCode")}</FieldLabel>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="text-center font-mono text-lg tracking-widest"
              required
            />
          </Field>
          {error && <p className="text-destructive text-sm">{error.message}</p>}
          <Button type="submit" disabled={code.length < 8 || isPending}>
            {isPending ? t("common.joining") : "Join Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
