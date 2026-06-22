"use client";

import LinkSquare01Icon from "@hugeicons/core-free-icons/LinkSquare01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

import { ListCell, ListSection } from "@/components/ui/list-cell";

const consentLeading = <HugeiconsIcon icon={LinkSquare01Icon} className="size-5" />;

export function ParentConsentSection({ userId }: { userId: string }) {
  const { data: requests } = useQuery({
    queryKey: ["parent-consent-requests", userId],
    queryFn: async () => {
      const res = await fetch(`/api/parent/consent?studentId=${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { status: string };
      return data;
    },
  });

  const trailing = useMemo(
    () =>
      requests ? (
        <Badge
          variant={requests.status === "granted" ? "default" : "secondary"}
          className={
            requests.status === "granted"
              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
              : ""
          }
        >
          {requests.status}
        </Badge>
      ) : undefined,
    [requests],
  );

  if (!requests) return null;

  return (
    <ListSection header="Parental Consent">
      <ListCell
        leading={consentLeading}
        title="Consent Status"
        subtitle={
          requests.status === "granted"
            ? "A parent can view your progress"
            : requests.status === "revoked"
              ? "Parent access has been revoked"
              : "No parent link active"
        }
        showSeparator={false}
        trailing={trailing}
      />
    </ListSection>
  );
}
