import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { Anim } from "@/components/shared/anim";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { SolveContent } from "./solve-content";

export default function SolvePage() {
  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="default" />
      <PageContainer>
        <AppErrorBoundary>
          <Anim>
            <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
              <SolveContent />
            </Suspense>
          </Anim>
        </AppErrorBoundary>
      </PageContainer>
    </div>
  );
}
