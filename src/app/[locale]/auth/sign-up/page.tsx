import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/skeletons";
import SignUpPage from "./sign-up-client";

export default function SignUpPageWrapper() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SignUpPage />
    </Suspense>
  );
}
