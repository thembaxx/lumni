"use client";

import { useCallback, useEffect, useState } from "react";
import { dexieDataAccess } from "@/lib/db";
import type { AssignmentMessage } from "@/lib/db/types";
import { logError } from "@/lib/shared/logger";

export function useAssignmentMessages(assignmentId: string) {
  const [messages, setMessages] = useState<AssignmentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(() => {
    let cancelled = false;
    dexieDataAccess.assignmentMessages
      .where("assignmentId")
      .equals(assignmentId)
      .toArray()
      .then((all) => {
        if (cancelled) return;
        all.sort((a, b) => a.createdAt - b.createdAt);
        setMessages(all);
      })
      .catch((err) => logError("useAssignmentMessages.load", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  useEffect(() => {
    const cancel = loadMessages();
    return cancel;
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      await dexieDataAccess.assignmentMessages.add({
        assignmentId,
        senderId: "current",
        senderRole: "teacher",
        content: content.trim(),
        createdAt: Date.now(),
      });
      const all = await dexieDataAccess.assignmentMessages
        .where("assignmentId")
        .equals(assignmentId)
        .toArray();
      all.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(all);
    },
    [assignmentId],
  );

  return { messages, loading, sendMessage };
}
