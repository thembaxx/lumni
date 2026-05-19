"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { iOSEase } from "@/lib/utils/animation";

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		router.push("/auth/sign-in");
	};

	if (!token) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="text-xl font-bold">Invalid reset link</h1>
				<p className="text-sm text-muted-foreground">
					This password reset link is invalid or has expired.
				</p>
				<Link
					href="/auth/forgot-password"
					className="text-sm font-semibold text-system-accent hover:underline"
				>
					Request a new reset link
				</Link>
			</div>
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
				<h1 className="text-xl font-bold">Set new password</h1>
				<p className="text-sm text-muted-foreground">
					Must be at least 8 characters.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="password" className="text-sm font-semibold">
						New password
					</label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
							className="pr-10 h-11 rounded-xl bg-system-surface"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						>
							<HugeiconsIcon
								icon={showPassword ? ViewOffIcon : ViewIcon}
								className="size-4"
							/>
						</button>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="confirm" className="text-sm font-semibold">
						Confirm password
					</label>
					<Input
						id="confirm"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						minLength={8}
						className="h-11 rounded-xl bg-system-surface"
					/>
				</div>

				{error && (
					<p className="text-sm text-destructive font-medium">{error}</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={!password || !confirmPassword}
				className="w-full h-11 rounded-xl"
			>
				Reset password
			</Button>
		</motion.form>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<ResetPasswordForm />
		</Suspense>
	);
}
