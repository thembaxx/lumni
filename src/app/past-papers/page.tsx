import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Past Papers",
};

export default function PastPapersPage() {
	redirect("/dashboard/exams");
}
