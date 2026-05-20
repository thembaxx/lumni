"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormSkeleton } from "@/components/ui/skeletons";
import { iOSEase } from "@/lib/utils/animation";

function VerifyEmailContent() {
	const { push } = useRouter();
	const { get } = useSearchParams();
	const userId = get("userId");
	const secret = get("secret");
	const [error, setError] = useState("");
	const calledRef = useRef(false);

	const { mutate } = useMutation({
		mutationFn: async () => {
			if (!userId || !secret) throw new Error("Invalid verification link");
			const res = await fetch("/api/auth/verify-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, secret }),
			});
			if (!res.ok) throw new Error("Verification failed");
			return res.json();
		},
		onError: (err) => setError(err.message),
	});

	// Mount-triggered mutation — safe because the fetch logic lives in react-query
	if (userId && secret && !calledRef.current) {
		calledRef.current = true;
		mutate();
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="font-semibold text-xl">Verification failed</h1>
				<p className="text-muted-foreground text-sm">{error}</p>
				<Link
					href="/auth/sign-in"
					className="font-semibold text-sm text-system-accent hover:underline"
				>
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			className="flex flex-col items-center gap-6 text-center"
		>
			<div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
				<HugeiconsIcon icon={SparklesIcon} className="size-8 text-green-500" />
			</div>
			<div className="flex flex-col gap-2">
				<h1 className="font-semibold text-xl">Email verified</h1>
				<p className="text-muted-foreground text-sm">
					Your email has been verified successfully.
				</p>
			</div>
			<Button onClick={() => push("/dashboard")} className="rounded-xl">
				Go to Dashboard
			</Button>
		</motion.div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<VerifyEmailContent />
		</Suspense>
	);
}
