import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ExamSessionClient } from "./exam-session-client";

export const metadata: Metadata = {
	title: "Exam Session - Lumni",
};

export default async function ExamPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ mode?: string }>;
}) {
	const { id } = await params;
	const { mode } = await searchParams;

	return (
		<ErrorBoundary>
			<ExamSessionClient
				id={id}
				mode={mode === "timed" ? "timed" : "practice"}
			/>
		</ErrorBoundary>
	);
}
