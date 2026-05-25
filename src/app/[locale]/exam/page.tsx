import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";

export const metadata: Metadata = {
	title: "Exams",
};

export default async function ExamIndexPage() {
	const locale = await getLocale();
	redirect({ href: "/dashboard/exams", locale });
}
