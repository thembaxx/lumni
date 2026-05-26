import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chat - Lumni",
	description: "Chat with your AI study assistant",
};

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
