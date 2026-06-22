"use client";

import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { Link, useRouter } from "@/i18n/navigation";
import { iOSEase } from "@/lib/utils/animation";

type ResetPasswordState = {
	password: string;
	confirmPassword: string;
	showPassword: boolean;
	error: string;
	loading: boolean;
	success: boolean;
};

type ResetPasswordAction =
	| { type: "SET_PASSWORD"; payload: string }
	| { type: "SET_CONFIRM_PASSWORD"; payload: string }
	| { type: "TOGGLE_SHOW_PASSWORD" }
	| { type: "SET_ERROR"; payload: string }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_LOADING"; payload: boolean }
	| { type: "SET_SUCCESS" };

const initialState: ResetPasswordState = {
	password: "",
	confirmPassword: "",
	showPassword: false,
	error: "",
	loading: false,
	success: false,
};

function resetPasswordReducer(
	state: ResetPasswordState,
	action: ResetPasswordAction,
): ResetPasswordState {
	switch (action.type) {
		case "SET_PASSWORD":
			return { ...state, password: action.payload };
		case "SET_CONFIRM_PASSWORD":
			return { ...state, confirmPassword: action.payload };
		case "TOGGLE_SHOW_PASSWORD":
			return { ...state, showPassword: !state.showPassword };
		case "SET_ERROR":
			return { ...state, error: action.payload };
		case "CLEAR_ERROR":
			return { ...state, error: "" };
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		case "SET_SUCCESS":
			return { ...state, success: true, loading: false };
		default:
			return state;
	}
}

function ResetPasswordForm() {
	const { push } = useRouter();
	const searchParams = useSearchParams();
	const userId = searchParams.get("userId");
	const secret = searchParams.get("secret");

	const [state, dispatch] = useReducer(resetPasswordReducer, initialState);
	const { password, confirmPassword, showPassword, error, loading, success } =
		state;
	const t = useTranslations();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		dispatch({ type: "CLEAR_ERROR" });

		if (password !== confirmPassword) {
			dispatch({ type: "SET_ERROR", payload: t("auth.passwordsDoNotMatch") });
			return;
		}
		if (password.length < 8) {
			dispatch({ type: "SET_ERROR", payload: t("auth.weakPassword") });
			return;
		}

		dispatch({ type: "SET_LOADING", payload: true });
		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, secret, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				dispatch({
					type: "SET_ERROR",
					payload: data.error || t("auth.resetFailed"),
				});
				return;
			}
			dispatch({ type: "SET_SUCCESS" });
			setTimeout(() => push("/auth/sign-in"), 2000);
		} catch {
			dispatch({ type: "SET_ERROR", payload: t("auth.networkError") });
		} finally {
			dispatch({ type: "SET_LOADING", payload: false });
		}
	};

	if (!userId || !secret) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<h1 className="font-heading font-semibold text-2xl">
					{t("auth.invalidResetLink")}
				</h1>
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
				<h1 className="font-heading font-semibold text-2xl">
					{t("auth.setNewPassword")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{success ? t("auth.resetSuccess") : t("auth.passwordHint")}
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
							onChange={(e) =>
								dispatch({ type: "SET_PASSWORD", payload: e.target.value })
							}
							required
							minLength={8}
							disabled={success}
							className="h-11 rounded-xl bg-system-surface pr-10"
						/>
						<button
							type="button"
							aria-label={
								showPassword ? t("auth.hidePassword") : t("auth.showPassword")
							}
							onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
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
						onChange={(e) =>
							dispatch({
								type: "SET_CONFIRM_PASSWORD",
								payload: e.target.value,
							})
						}
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
				{loading
					? t("auth.resetting")
					: success
						? t("auth.done")
						: t("auth.resetPassword")}
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
