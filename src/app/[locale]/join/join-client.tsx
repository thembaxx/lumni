"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/shared/api-fetch";

export function JoinClient() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (joinCode: string) => {
      const res = await apiFetch<{ success: boolean } | { error: string }>("/api/student/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      router.push("/dashboard?joined=success");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      mutate(code.trim().toUpperCase());
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Join a Classroom</h1>
        <p className="text-muted-foreground">
          Enter the 6-character code provided by your teacher.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          className="text-center text-lg font-mono tracking-widest uppercase"
          aria-label="Join code"
          disabled={isPending}
        />
        <Button type="submit" disabled={code.length !== 6 || isPending}>
          {isPending ? "Joining..." : "Join Classroom"}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {error.message}
        </div>
      )}
    </div>
  );
}
