import type { Metadata } from "next";
import { StudentReportClient } from "./student-report-client";

export const metadata: Metadata = {
	title: "Student Report - Lumni",
	description: "View detailed student progress and competency report",
};

export default function StudentReportPage({
	params,
}: {
	params: Promise<{ studentId: string }>;
}) {
	return <StudentReportClient params={params} />;
}
