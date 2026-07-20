"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAssignmentMessages } from "@/hooks/use-assignment-messages";
import { cn } from "@/lib/utils";

interface AssignmentThreadProps {
  assignmentId: string;
}

export function AssignmentThread({ assignmentId }: AssignmentThreadProps) {
  const { messages, loading: _loading, sendMessage: sendMsg } = useAssignmentMessages(assignmentId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await sendMsg(newMessage.trim());
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
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3",
                msg.senderRole === "teacher" ? "bg-muted/30" : "",
              )}
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
