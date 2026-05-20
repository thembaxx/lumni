import type { Metadata } from "next";
import { ExamsBrowse } from "@/components/dashboard/practice/exams-browse";

export const metadata: Metadata = {
	title: "Past Papers",
};

export default function PastPapersPage() {
	return <ExamsBrowse />;
}
