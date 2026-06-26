import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import UploadContent from "./upload-content";

export const instant = false;

export default function UploadPage() {
  return (
    <PageContainer>
      <Suspense fallback={<PageSkeleton />}>
        <UploadContent />
      </Suspense>
    </PageContainer>
  );
}
