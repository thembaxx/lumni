"use client";

import { Mail01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
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
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: iOSEase }}
				className="flex flex-col items-center gap-6 text-center"
			>
				<div className="size-16 rounded-full bg-system-accent/10 flex items-center justify-center">
					<HugeiconsIcon
						icon={SparklesIcon}
						className="size-8 text-system-accent"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-xl font-bold">Check your email</h1>
					<p className="text-sm text-muted-foreground">
						If an account exists for <strong>{email}</strong>, we sent password
						reset instructions.
					</p>
				</div>
				<Link
					href="/auth/sign-in"
					className="text-sm font-semibold text-system-accent hover:underline"
				>
					Back to sign in
				</Link>
			</motion.div>
		);
	}

	return (
		<motion.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSubmit}
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-2">
				<h1 className="text-xl font-bold">Reset password</h1>
				<p className="text-sm text-muted-foreground">
					Enter your email and we&apos;ll send you a reset link.
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<label htmlFor="email" className="text-sm font-semibold">
					Email
				</label>
				<div className="relative">
					<HugeiconsIcon
						icon={Mail01Icon}
						className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
					/>
					<Input
						id="email"
						type="email"
						placeholder="you@school.edu"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="pl-10 h-11 rounded-xl bg-system-surface"
					/>
				</div>
			</div>

			<Button
				type="submit"
				disabled={!email}
				className="w-full h-11 rounded-xl"
			>
				Send reset link
			</Button>

			<p className="text-sm text-muted-foreground text-center">
				Remember your password?{" "}
				<Link
					href="/auth/sign-in"
					className="font-semibold text-system-accent hover:underline"
				>
					Sign in
				</Link>
			</p>
		</motion.form>
	);
}
