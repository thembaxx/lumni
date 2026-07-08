"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { dexieDataAccess } from "@/lib/db";
import type { AssignmentMessage } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";

interface AssignmentThreadProps {
  assignmentId: string;
}

export function AssignmentThread({ assignmentId }: AssignmentThreadProps) {
  const [messages, setMessages] = useState<AssignmentMessage[]>([]);
  const [_loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
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
      .catch((err) => logError("AssignmentThreadLoad", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await dexieDataAccess.assignmentMessages.add({
      assignmentId,
      senderId: "current",
      senderRole: "teacher",
      content: newMessage.trim(),
      createdAt: Date.now(),
    });
    const all = await dexieDataAccess.assignmentMessages
      .where("assignmentId")
      .equals(assignmentId)
      .toArray();
    all.sort((a, b) => a.createdAt - b.createdAt);
    setMessages(all);
    setNewMessage("");
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-10 text-sm"
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          size="sm"
          className="shrink-0"
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-xs">No messages yet</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={`flex flex-col gap-1 rounded-lg border p-3 ${msg.senderRole === "teacher" ? "bg-muted/30" : ""}`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-(--fs-caption-3) text-muted-foreground">
                {msg.senderRole === "teacher" ? "Teacher" : "Student"} ·{" "}
                {new Date(msg.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
