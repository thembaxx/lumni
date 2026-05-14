import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Sign In",
		template: "%s | Lumni",
	},
	robots: {
		index: false,
	},
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-[100dvh] bg-system-grouped flex flex-col">
			<div className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="w-full max-w-sm">{children}</div>
			</div>
		</div>
	);
}
