import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { NationalExamCalendar } from "@/components/tools/scheduling/national-exam-calendar";

export const metadata: Metadata = {
  title: "Exam Dates - Lumni",
};

export default function ExamDatesPage() {
  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <PageContainer>
        <NationalExamCalendar />
      </PageContainer>
    </div>
  );
}
