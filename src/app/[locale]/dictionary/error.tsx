"use client";

import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-heading font-semibold text-2xl">Dictionary unavailable</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        {error?.message ||
          "Something went wrong. Please try again or contact support if this persists."}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
