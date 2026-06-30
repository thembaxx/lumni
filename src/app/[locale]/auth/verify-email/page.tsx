import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/skeletons";
import VerifyEmailPage from "./verify-email-client";

export default function VerifyEmailPageWrapper() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <VerifyEmailPage />
    </Suspense>
  );
}

export const instant = false;
