import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Lumni",
	robots: { index: false },
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-[100dvh] flex-col bg-system-grouped">
			<div className="flex flex-1 items-center justify-center px-6 py-12">
				<div className="w-full max-w-sm">{children}</div>
			</div>
		</div>
	);
}
