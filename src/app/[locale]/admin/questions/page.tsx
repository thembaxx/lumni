import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import AdminQuestionsPage from "./admin-questions-content";

export default function AdminQuestionsPageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminQuestionsPage />
    </Suspense>
  );
}
