import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Upload - Lumni",
	description: "Upload exam papers and study materials",
};

export default function UploadLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
