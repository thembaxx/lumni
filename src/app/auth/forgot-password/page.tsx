export const metadata = {
	title: "Forgot password",
	description: "Reset your password",
};

("use client");

import { Mail01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { iOSEase } from "@/lib/utils/animation";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
		} catch {
			// swallow — show success regardless (no user enumeration)
		}
		setSent(true);
	};

	if (sent) {
		return (
			<m.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: iOSEase }}
				className="flex flex-col items-center gap-6 text-center"
			>
				<div className="flex size-16 items-center justify-center rounded-full bg-system-accent/10">
					<HugeiconsIcon
						icon={SparklesIcon}
						className="size-8 text-system-accent"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="font-semibold text-xl">Check your email</h1>
					<p className="text-muted-foreground text-sm">
						If an account exists for <strong>{email}</strong>, we sent password
						reset instructions.
					</p>
				</div>
				<Link
					href="/auth/sign-in"
					className="font-semibold text-sm text-system-accent hover:underline"
				>
					Back to sign in
				</Link>
			</m.div>
		);
	}

	return (
		<m.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSubmit}
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-2">
				<h1 className="font-semibold text-xl">Reset password</h1>
				<p className="text-muted-foreground text-sm">
					Enter your email and we&apos;ll send you a reset link.
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<label htmlFor="email" className="font-semibold text-sm">
					Email
				</label>
				<div className="relative">
					<HugeiconsIcon
						icon={Mail01Icon}
						className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id="email"
						type="email"
						placeholder="you@school.edu"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="h-11 rounded-xl bg-system-surface pl-10"
					/>
				</div>
			</div>

			<Button
				type="submit"
				disabled={!email}
				className="h-11 w-full rounded-xl"
			>
				Send reset link
			</Button>

			<p className="text-center text-muted-foreground text-sm">
				Remember your password?{" "}
				<Link
					href="/auth/sign-in"
					className="font-semibold text-system-accent hover:underline"
				>
					Sign in
				</Link>
			</p>
		</m.form>
	);
}
