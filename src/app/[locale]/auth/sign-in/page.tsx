"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/ui/skeletons";

const SignInForm = dynamic(
  () => import("./sign-in-form").then((m) => ({ default: m.SignInForm })),
  { ssr: false },
);

export default function SignInPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
