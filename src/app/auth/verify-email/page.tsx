"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const userId = searchParams.get("userId");
	const secret = searchParams.get("secret");
	const [_verified, setVerified] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (userId && secret) {
			fetch("/api/auth/verify-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, secret }),
			})
				.then((res) => {
					if (!res.ok) throw new Error("Verification failed");
					return res.json();
				})
				.then(() => setVerified(true))
				.catch((err) => setError(err.message));
		} else {
			setError("Invalid verification link");
		}
	}, [userId, secret]);

	if (error) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="text-xl font-bold">Verification failed</h1>
				<p className="text-sm text-muted-foreground">{error}</p>
				<Link
					href="/auth/sign-in"
					className="text-sm font-semibold text-system-accent hover:underline"
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
			<div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center">
				<HugeiconsIcon icon={SparklesIcon} className="size-8 text-green-500" />
			</div>
			<div className="flex flex-col gap-2">
				<h1 className="text-xl font-bold">Email verified</h1>
				<p className="text-sm text-muted-foreground">
					Your email has been verified successfully.
				</p>
			</div>
			<Button onClick={() => router.push("/dashboard")} className="rounded-xl">
				Go to Dashboard
			</Button>
		</motion.div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={null}>
			<VerifyEmailContent />
		</Suspense>
	);
}
