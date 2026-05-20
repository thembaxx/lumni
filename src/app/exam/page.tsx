import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Exams",
};

export default function ExamIndexPage() {
	redirect("/dashboard/exams");
}
