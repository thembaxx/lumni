"use client";

import { Button } from "@/components/ui/button";

export function SchoolClient() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">School Account</h1>
        <p className="text-muted-foreground">Set up or manage your school account.</p>
      </div>
      <Button
        onClick={() => {
          window.location.href = "/school/onboarding";
        }}
      >
        Get Started
      </Button>
    </div>
  );
}
