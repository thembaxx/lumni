"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { iOSEase } from "@/lib/utils/animation";

function ResetPasswordForm() {
	const { push } = useRouter();
	const { get } = useSearchParams();
	const userId = get("userId");
	const secret = get("secret");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const t = useTranslations();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError(t("auth.passwordsDoNotMatch"));
			return;
		}
		if (password.length < 8) {
			setError(t("auth.weakPassword"));
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, secret, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || t("auth.resetFailed"));
				return;
			}
			setSuccess(true);
			setTimeout(() => push("/auth/sign-in"), 2000);
		} catch {
			setError(t("auth.networkError"));
		} finally {
			setLoading(false);
		}
	};

	if (!userId || !secret) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="font-semibold text-xl">{t("auth.invalidResetLink")}</h1>
				<p className="text-muted-foreground text-sm">
					{t("auth.invalidResetLinkDesc")}
				</p>
				<Link
					href="/auth/forgot-password"
					className="font-semibold text-sm text-system-accent hover:underline"
				>
					{t("auth.requestNewResetLink")}
				</Link>
			</div>
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
				<h1 className="font-semibold text-xl">{t("auth.setNewPassword")}</h1>
				<p className="text-muted-foreground text-sm">
					{success
						? t("auth.resetSuccess")
						: t("auth.passwordHint")}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="password" className="font-semibold text-sm">
						{t("auth.newPasswordLabel")}
					</label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
							disabled={success}
							className="h-11 rounded-xl bg-system-surface pr-10"
						/>
						<button
							type="button"
							aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
							onClick={() => setShowPassword(!showPassword)}
							className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
						>
							<HugeiconsIcon
								icon={showPassword ? ViewOffIcon : ViewIcon}
								className="size-4"
							/>
						</button>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="confirm" className="font-semibold text-sm">
						{t("auth.confirmPassword")}
					</label>
					<Input
						id="confirm"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						minLength={8}
						disabled={success}
						className="h-11 rounded-xl bg-system-surface"
					/>
				</div>

				{error && (
					<p className="font-medium text-destructive text-sm">{error}</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={!password || !confirmPassword || loading || success}
				className="h-11 w-full rounded-xl"
			>
				{loading ? t("auth.resetting") : success ? t("auth.done") : t("auth.resetPassword")}
			</Button>
		</m.form>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<ResetPasswordForm />
		</Suspense>
	);
}
