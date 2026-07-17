"use client";

import UserMultipleIcon from "@hugeicons/core-free-icons/UserMultipleIcon";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownList,
  DropdownListContent,
  DropdownListItem,
  DropdownListTrigger,
} from "@/components/ui/dropdown-menu";
import { logError } from "@/lib/shared/logger";
import { useToast } from "@/hooks/use-toast";

interface InviteButtonProps {
  channelName: string;
  inviteCode: string;
  subject: string;
}

export function InviteButton({ channelName, inviteCode, subject }: InviteButtonProps) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const handleCopyCode = useCallback(() => {
    try {
      const result = navigator.clipboard.writeText(inviteCode);
      if (result && typeof result.catch === "function")
        result.catch((err) => logError("InviteButton.clipboard", err));
    } catch {
      logError("InviteButton.clipboard", new Error("Clipboard unavailable"));
    }
    toast({
      type: "success",
      message: "Invite code copied",
      description: `Share code: ${inviteCode}`,
    });
    setOpen(false);
  }, [inviteCode, toast]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/quiz?shared=${channelName}&subject=${encodeURIComponent(subject)}`;
    try {
      const result = navigator.clipboard.writeText(url);
      if (result && typeof result.catch === "function")
        result.catch((err) => logError("InviteButton.clipboard", err));
    } catch {
      logError("InviteButton.clipboard", new Error("Clipboard unavailable"));
    }
    toast({
      type: "success",
      message: "Share link copied",
      description: "Share this link with study buddies",
    });
    setOpen(false);
  }, [channelName, subject, toast]);

  return (
    <DropdownList open={open} onOpenChange={setOpen}>
      <DropdownListTrigger>
        <Button variant="outline" size="sm" className="gap-2 min-h-10 rounded-xl press-scale">
          <HugeiconsIcon icon={UserMultipleIcon} className="size-4" data-icon="inline-start" />
          Study Together
        </Button>
      </DropdownListTrigger>
      <DropdownListContent align="end" className="w-56">
        <DropdownListItem onClick={handleCopyCode} className="gap-3">
          <HugeiconsIcon icon={Copy01Icon} className="size-4" data-icon="inline-start" />
          <div className="flex flex-col">
            <span>Copy invite code</span>
            <span className="font-mono text-(--fs-caption-2) text-muted-foreground">
              {inviteCode}
            </span>
          </div>
        </DropdownListItem>
        <DropdownListItem onClick={handleCopyLink} className="gap-3">
          <HugeiconsIcon icon={Copy01Icon} className="size-4" data-icon="inline-start" />
          <div className="flex flex-col">
            <span>Copy share link</span>
            <span className="text-(--fs-caption-2) text-muted-foreground">
              Invite study buddies
            </span>
          </div>
        </DropdownListItem>
      </DropdownListContent>
    </DropdownList>
  );
}
