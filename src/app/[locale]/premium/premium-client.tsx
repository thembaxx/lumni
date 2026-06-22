"use client";

import CrownIcon from "@hugeicons/core-free-icons/CrownIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageContainer } from "@/components/layout/page-container";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

export function PremiumClient() {
  const { push } = useRouter();

  return (
    <PageContainer className="flex min-h-dvh justify-center bg-background py-6">
      <AppErrorBoundary>
        <Card>
          <CardHeader className="text-center">
            <div className="mb-3 flex justify-center">
              <HugeiconsIcon
                icon={CrownIcon}
                size={40}
                className="text-amber-400 dark:text-amber-300"
              />
            </div>
            <CardTitle className="text-2xl">All Features Free</CardTitle>
            <p className="mt-1 text-muted-foreground text-sm">
              Every Lumni feature is now available to all users at no cost.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            <Button variant="ghost" onClick={() => push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AppErrorBoundary>
    </PageContainer>
  );
}
