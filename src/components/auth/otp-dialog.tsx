"use client";

import {
	AlertCircleIcon,
	CheckmarkCircle01Icon,
	FlashIcon,
	RadialIcon,
	RefreshIcon,
	ShieldCheck,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import {
	startTransition,
	useCallback,
	useEffect,
	useReducer,
	useState,
} from "react";
import { z } from "zod";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { buttonStyles, countdownStyles, iconStyles } from "./auth-styles";
import { formatCountdown } from "./countdown-utils";
import { LoadingDots } from "./loading-dots";
import { SuccessBadge } from "./success-badge";

const otpSendSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type AuthDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (isAdmin: boolean) => void;
};

type OTPForm = {
	email: string;
	otp: string;
	error: string;
	sent: boolean;
	countdown: number;
	remainingAttempts: number | null;
	verified: boolean;
};

type OTPAction =
	| { type: "SET_EMAIL"; email: string }
	| { type: "SET_OTP"; otp: string }
	| { type: "SET_ERROR"; error: string }
	| { type: "SET_SENT" }
	| { type: "SET_COUNTDOWN"; countdown: number }
	| { type: "SET_REMAINING_ATTEMPTS"; remainingAttempts: number | null }
	| { type: "SET_VERIFIED" }
	| { type: "TICK" }
	| { type: "RESET" };

function otpReducer(state: OTPForm, action: OTPAction): OTPForm {
	switch (action.type) {
		case "SET_EMAIL":
			return { ...state, email: action.email };
		case "SET_OTP":
			return { ...state, otp: action.otp };
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "SET_SENT":
			return { ...state, sent: true, countdown: 2 * 60 * 1000 };
		case "SET_COUNTDOWN":
			return { ...state, countdown: action.countdown };
		case "SET_REMAINING_ATTEMPTS":
			return { ...state, remainingAttempts: action.remainingAttempts };
		case "SET_VERIFIED":
			return { ...state, verified: true };
		case "TICK":
			return {
				...state,
				countdown: Math.max(0, state.countdown - 1000),
			};
		case "RESET":
			return {
				email: "",
				otp: "",
				error: "",
				sent: false,
				countdown: 0,
				remainingAttempts: null,
				verified: false,
			};
	}
}

const initialOTPState: OTPForm = {
	email: "",
	otp: "",
	error: "",
	sent: false,
	countdown: 0,
	remainingAttempts: null,
	verified: false,
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
				result.error.errors[0]?.message || "Enter a valid email address";
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

	useEffect(() => {
		if (!open) {
			dispatch({ type: "RESET" });
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="shadow-lg sm:max-w-md">
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
						<div className="flex flex-col gap-2">
							<Input
								type="email"
								placeholder="email@example.com"
								value={email}
								onChange={(e) => {
									dispatch({ type: "SET_EMAIL", email: e.target.value });
									dispatch({ type: "SET_ERROR", error: "" });
								}}
								autoComplete="email"
								className="-webkit-font-smoothing h-11 rounded-md antialiased ring-1 ring-transparent transition-[ring-color,box-shadow] duration-150 focus-within:ring-[--system-accent]/30"
							/>
							{error && (
								<p className="flex items-center gap-1 text-destructive text-xs">
									<HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
									{error}
								</p>
							)}
						</div>
					) : (
						<Anim>
							<m.div
								className="flex flex-col items-center gap-4 py-2"
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: {
										duration: 0.3,
										ease: iOSEase,
									},
								}}
								exit={{
									opacity: 0,
									y: -8,
									transition: {
										duration: 0.2,
										ease: iOSEase,
									},
								}}
							>
								{!verified && (
									<>
										<div className="relative">
											<m.div
												initial={{ scale: 0.8, opacity: 0 }}
												animate={{
													scale: 1,
													opacity: 1,
													transition: {
														type: "spring",
														stiffness: 350,
														damping: 18,
													},
												}}
											>
												<div className="rounded-full bg-success/10 p-3">
													<HugeiconsIcon
														icon={CheckmarkCircle01Icon}
														className="size-8 text-success"
													/>
												</div>
											</m.div>
										</div>

										<div className="text-center">
											<p className="text-muted-foreground text-sm">
												We&apos;ve sent a verification code to:{" "}
												<span className="font-medium text-foreground">
													{email}
												</span>
											</p>
										</div>

										<div className="flex w-full flex-col gap-3">
											<div className="flex justify-center">
												<InputOTP
													value={otp}
													onChange={(value) =>
														dispatch({ type: "SET_OTP", otp: value })
													}
													maxLength={6}
													aria-invalid={
														remainingAttempts !== null && remainingAttempts < 3
													}
													onComplete={handleVerify}
												>
													<InputOTPGroup>
														<InputOTPSlot index={0} />
														<InputOTPSlot index={1} />
														<InputOTPSlot index={2} />
														<InputOTPSlot index={3} />
														<InputOTPSlot index={4} />
														<InputOTPSlot index={5} />
													</InputOTPGroup>
												</InputOTP>
											</div>

											{error && (
												<p className="flex items-center justify-center gap-1 text-destructive text-xs">
													<HugeiconsIcon
														icon={AlertCircleIcon}
														className="size-3"
													/>
													{error}
												</p>
											)}
										</div>

										<Button
											onClick={handleVerify}
											disabled={loading || otp.length !== 6}
											className={cn("w-full", buttonStyles)}
										>
											{loading ? (
												<span className="flex items-center gap-2">
													<LoadingDots />
													<span>Verifying…</span>
												</span>
											) : (
												<span className="flex items-center gap-2">
													<HugeiconsIcon icon={FlashIcon} className="size-4" />
													Verify
												</span>
											)}
										</Button>

										<div className="flex w-full items-center gap-4">
											<div className="h-px flex-1 bg-border" />
											<span className="text-muted-foreground text-xs">
												Didn&apos;t receive it?
											</span>
											<div className="h-px flex-1 bg-border" />
										</div>

										<div className="flex w-full items-center justify-between">
											<p
												className={cn(
													"text-muted-foreground text-sm",
													countdownStyles,
												)}
											>
												{countdown > 0 ? (
													<span className="font-medium text-foreground tabular-nums">
														{formatCountdown(countdown)}
													</span>
												) : (
													<span className="flex items-center gap-1 text-foreground">
														<HugeiconsIcon
															icon={FlashIcon}
															className="size-3"
														/>
														Ready
													</span>
												)}
											</p>

											<Button
												variant="ghost"
												size="sm"
												onClick={handleResend}
												disabled={loading || countdown > 0}
												className={cn(buttonStyles, loading && "opacity-70")}
											>
												{loading ? (
													<HugeiconsIcon
														icon={RadialIcon}
														className="size-4 animate-spin"
													/>
												) : (
													<>
														<HugeiconsIcon
															icon={RefreshIcon}
															className={cn(
																"size-4",
																iconStyles,
																countdown > 0 && "animate-pulse",
															)}
														/>
														<span className="ml-2">Resend OTP</span>
													</>
												)}
											</Button>
										</div>
									</>
								)}

								{verified && (
									<m.div
										className="flex flex-col items-center gap-4 py-8"
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{
											opacity: 1,
											scale: 1,
											transition: {
												type: "spring",
												stiffness: 300,
												damping: 20,
												delay: 0.05,
											},
										}}
									>
										<div className="relative">
											<m.div
												initial={{ scale: 0.8, opacity: 0 }}
												animate={{
													scale: 1,
													opacity: 1,
													transition: {
														type: "spring",
														stiffness: 350,
														damping: 18,
													},
												}}
											>
												<div className="rounded-full bg-success/20 p-6">
													<HugeiconsIcon
														icon={CheckmarkCircle01Icon}
														className="size-16 text-success"
													/>
												</div>
											</m.div>
											<SuccessBadge isAdmin={true} />
										</div>
										<p className="font-medium text-foreground text-lg">
											You&apos;re in!
										</p>
										<p className="animate-pulse text-muted-foreground text-sm">
											Redirecting…
										</p>
									</m.div>
								)}
							</m.div>
						</Anim>
					)}

					{!sent && (
						<Button
							onClick={handlePaperPlane}
							disabled={loading || !email}
							className={cn("w-full", buttonStyles)}
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<LoadingDots />
									<span>PaperPlaneing…</span>
								</span>
							) : (
								<span className="flex items-center gap-2">
									<HugeiconsIcon icon={FlashIcon} className="size-4" />
									MailSend01Icon OTP
								</span>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
