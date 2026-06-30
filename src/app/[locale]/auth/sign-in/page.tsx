import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/skeletons";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
