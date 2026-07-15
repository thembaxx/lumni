"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { isValidWebhookUrl } from "@/lib/webhooks/validate";

const EVENT_OPTIONS = [
  "quiz.completed",
  "achievement.unlocked",
  "study-session.started",
  "study-session.ended",
] as const;

export function WebhookManager() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const { data: endpoints = [] } = useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: async () => {
      const res = await fetch("/api/webhooks/endpoints");
      if (!res.ok) throw new Error("Failed to fetch endpoints");
      const data = await res.json();
      return data.endpoints ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { url: string; events: string[]; description?: string }) => {
      const res = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create endpoint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints"] });
      setUrl("");
      setDescription("");
      setSelectedEvents([]);
      setShowForm(false);
      toast({ type: "success", message: "Webhook endpoint created" });
    },
    onError: () => {
      toast({ type: "error", message: "Failed to create webhook endpoint" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/webhooks/endpoints", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete endpoint");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-endpoints"] });
      toast({ type: "success", message: "Webhook endpoint deleted" });
    },
    onError: () => {
      toast({ type: "error", message: "Failed to delete webhook endpoint" });
    },
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCreate = () => {
    if (!url.trim()) {
      toast({ type: "error", message: "URL is required" });
      return;
    }
    const validation = isValidWebhookUrl(url.trim());
    if (!validation.valid) {
      toast({ type: "error", message: validation.reason ?? "Invalid URL" });
      return;
    }
    if (selectedEvents.length === 0) {
      toast({ type: "error", message: "Select at least one event" });
      return;
    }
    createMutation.mutate({
      url: url.trim(),
      events: selectedEvents,
      description: description.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this webhook endpoint?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Endpoints</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {endpoints.length === 0 && !showForm && (
          <p className="text-muted-foreground text-sm">No webhook endpoints configured.</p>
        )}

        {endpoints.map(
          (ep: {
            id: string;
            url: string;
            description?: string;
            events: string[];
            enabled: boolean;
          }) => (
            <div key={ep.id} className="flex flex-col gap-2 rounded-xl border border-border/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{ep.url}</p>
                  {ep.description && (
                    <p className="mt-0.5 truncate text-muted-foreground text-xs">
                      {ep.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ep.events.map((ev: string) => (
                      <span
                        key={ev}
                        className="rounded-md bg-system-accent/10 px-2 py-0.5 font-medium text-xs text-system-accent"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(ep.id)}
                  aria-label="Delete webhook endpoint"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            </div>
          ),
        )}

        {showForm && (
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 p-3">
            <Input
              placeholder="https://hooks.example.com/callback"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Webhook URL"
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Webhook description"
            />
            <div className="flex flex-col gap-1.5">
              <p className="font-medium text-xs text-muted-foreground">Events</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_OPTIONS.map((ev) => (
                  <label
                    key={ev}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 px-2.5 py-1.5 text-xs transition-colors has-data-checked:border-system-accent has-data-checked:bg-system-accent/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(ev)}
                      onChange={() => toggleEvent(ev)}
                      className="size-3.5 accent-system-accent"
                    />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setShowForm(true)}
          >
            Add Endpoint
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
