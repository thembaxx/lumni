"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VALID_ROLES = ["teacher", "parent", "student"] as const;

export function RoleSelector({ currentLabels }: { currentLabels: string[] }) {
  const queryClient = useQueryClient();
  const currentRole = VALID_ROLES.find((r) => currentLabels.includes(r)) ?? "student";

  const setRole = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to set role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast({ type: "success", message: "Role updated" });
    },
    onError: () => toast({ type: "error", message: "Failed to update role" }),
  });

  return (
    <div className="flex gap-1">
      {VALID_ROLES.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => setRole.mutate(role)}
          disabled={setRole.isPending}
          className={cn(
            "rounded-lg px-2.5 py-1 font-semibold text-xs capitalize transition-colors",
            currentRole === role
              ? "bg-system-accent text-system-accent-foreground"
              : "bg-system-fill text-muted-foreground hover:bg-system-fill/80",
          )}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
