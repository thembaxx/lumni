import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/skeletons";
import { VerifyClient } from "./verify-client";

export default function VerifyPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <VerifyClient />
    </Suspense>
  );
}
