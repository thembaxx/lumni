import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ExamsBrowse } from "@/components/dashboard/practice/exams-browse";


export default function ExamsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamsBrowse />
    </Suspense>
  );
}
