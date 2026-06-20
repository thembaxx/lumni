"use client";

import { ShieldCheck } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	startTransition,
	useCallback,
	useEffect,
	useReducer,
	useState,
} from "react";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { OtpEmailForm } from "./otp-email-form";
import { initialOTPState, otpReducer } from "./otp-reducer";
import { OtpVerificationForm } from "./otp-verification-form";
import { OtpVerifiedView } from "./otp-verified-view";

const otpSendSchema = z.object({
	email: z.email("Please enter a valid email address"),
});

type AuthDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (isAdmin: boolean) => void;
};

export function OTPDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
	const [form, dispatch] = useReducer(otpReducer, initialOTPState);
	const { email, otp, error, sent, countdown, remainingAttempts, verified } =
		form;
	const [loading, setLoading] = useState(false);

	const handlePaperPlane = useCallback(async () => {
		const result = otpSendSchema.safeParse({ email });
		if (!result.success) {
			const msg =
				result.error.issues[0]?.message || "Enter a valid email address";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({ type: "error", message: msg });
			return;
		}

		setLoading(true);
		dispatch({ type: "SET_ERROR", error: "" });

		try {
			const res = await fetch("/api/admin/auth/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					dispatch({
						type: "SET_COUNTDOWN",
						countdown: data.lockRemaining || data.countdown,
					});
				}
				const msg = data.error || "Could not send code";
				dispatch({ type: "SET_ERROR", error: msg });
				toast({ type: "error", message: msg });
				return;
			}

			dispatch({ type: "SET_SENT" });
			toast({
				type: "success",
				message: "Check your inbox",
				description: `Verification code sent to ${email}`,
			});
		} catch {
			const msg = "Connection failed. Try again.";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email]);

	const handleVerify = useCallback(async () => {
		if (otp.length !== 6) {
			const msg = "Enter all 6 digits from your email";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({ type: "error", message: msg });
			return;
		}

		setLoading(true);
		dispatch({ type: "SET_ERROR", error: "" });

		try {
			const res = await fetch("/api/admin/auth/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ otpId: email, code: otp }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked) {
					dispatch({
						type: "SET_COUNTDOWN",
						countdown: data.lockDuration,
					});
				}
				if (data.remainingAttempts !== undefined) {
					dispatch({
						type: "SET_REMAINING_ATTEMPTS",
						remainingAttempts: data.remainingAttempts,
					});
				}
				const msg = data.error || "Incorrect code";
				dispatch({ type: "SET_ERROR", error: msg });
				toast({
					type: "error",
					message: msg,
					description: data.remainingAttempts
						? `${data.remainingAttempts} attempt(s) left`
						: "Try again or request a new code",
				});
				dispatch({ type: "SET_OTP", otp: "" });
				return;
			}

			localStorage.setItem("admin_session", "true");
			localStorage.setItem("admin_email", email);
			localStorage.setItem(
				"admin_access",
				data.isFullAccess ? "full" : "limited",
			);

			dispatch({ type: "SET_VERIFIED" });
			toast({
				type: "success",
				message: data.isAdmin
					? "Welcome back, Admin!"
					: "Signed in successfully",
				description: data.isAdmin
					? "Full admin access granted"
					: "Limited access",
			});

			startTransition(() => {
				onSuccess(data.isAdmin);
				onOpenChange(false);
			});
		} catch {
			const msg = "Connection failed";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({
				type: "error",
				message: msg,
			});
			dispatch({ type: "SET_OTP", otp: "" });
		} finally {
			setLoading(false);
		}
	}, [email, otp, onOpenChange, onSuccess]);

	const handleResend = useCallback(async () => {
		if (countdown > 0) return;

		setLoading(true);
		dispatch({ type: "SET_ERROR", error: "" });
		dispatch({ type: "SET_OTP", otp: "" });

		try {
			const res = await fetch("/api/admin/auth/resend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "otp", email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					dispatch({
						type: "SET_COUNTDOWN",
						countdown: data.lockRemaining || data.countdown,
					});
				}
				const msg = data.error || "Could not resend code";
				dispatch({ type: "SET_ERROR", error: msg });
				toast({ type: "error", message: msg });
				return;
			}

			dispatch({ type: "SET_COUNTDOWN", countdown: 2 * 60 * 1000 });
			toast({
				type: "success",
				message: "Code resent",
				description: `New code sent to ${email}`,
			});
		} catch {
			const msg = "Connection failed. Try again.";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email, countdown]);

	useEffect(() => {
		if (!sent || countdown <= 0) return;
		const interval = setInterval(() => {
			dispatch({ type: "TICK" });
		}, 1000);
		return () => clearInterval(interval);
	}, [sent, countdown]);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				dispatch({ type: "RESET" });
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="shadow-level-3 sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HugeiconsIcon
							icon={ShieldCheck}
							className="size-5 text-foreground"
						/>
						Sign in with Email OTP
					</DialogTitle>
					<DialogDescription>
						{sent
							? "Enter the verification code from your email"
							: "Enter your email to receive a verification code"}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{!sent ? (
						<OtpEmailForm
							email={email}
							error={error}
							loading={loading}
							onEmailChange={(v) => {
								dispatch({ type: "SET_EMAIL", email: v });
								dispatch({ type: "SET_ERROR", error: "" });
							}}
							onSend={handlePaperPlane}
						/>
					) : !verified ? (
						<OtpVerificationForm
							email={email}
							otp={otp}
							error={error}
							countdown={countdown}
							remainingAttempts={remainingAttempts}
							loading={loading}
							onOtpChange={(v) => dispatch({ type: "SET_OTP", otp: v })}
							onVerify={handleVerify}
							onResend={handleResend}
						/>
					) : (
						<OtpVerifiedView />
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
