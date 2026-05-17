import {
	AlertCircleIcon,
	CheckmarkCircle01Icon,
	FlashIcon,
	RadialIcon,
	RefreshIcon,
	ShieldCheck,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { startTransition, useCallback, useEffect, useState } from "react";
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

export function OTPDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
		null,
	);
	const [verified, setVerified] = useState(false);

	const handlePaperPlane = useCallback(async () => {
		const result = otpSendSchema.safeParse({ email });
		if (!result.success) {
			const msg =
				result.error.errors[0]?.message || "Enter a valid email address";
			setError(msg);
			toast({ type: "error", message: msg });
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/auth/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					setCountdown(data.lockRemaining || data.countdown);
				}
				const msg = data.error || "Could not send code";
				setError(msg);
				toast({ type: "error", message: msg });
				return;
			}

			setSent(true);
			setCountdown(2 * 60 * 1000);
			toast({
				type: "success",
				message: "Check your inbox",
				description: `Verification code sent to ${email}`,
			});
		} catch {
			const msg = "Connection failed. Try again.";
			setError(msg);
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email]);

	const handleVerify = useCallback(async () => {
		if (otp.length !== 6) {
			const msg = "Enter all 6 digits from your email";
			setError(msg);
			toast({ type: "error", message: msg });
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/auth/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ otpId: email, code: otp }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked) {
					setCountdown(data.lockDuration);
				}
				if (data.remainingAttempts !== undefined) {
					setRemainingAttempts(data.remainingAttempts);
				}
				const msg = data.error || "Incorrect code";
				setError(msg);
				toast({
					type: "error",
					message: msg,
					description: data.remainingAttempts
						? `${data.remainingAttempts} attempt(s) left`
						: "Try again or request a new code",
				});
				setOtp("");
				return;
			}

			localStorage.setItem("admin_session", "true");
			localStorage.setItem("admin_email", email);
			localStorage.setItem(
				"admin_access",
				data.isFullAccess ? "full" : "limited",
			);

			setVerified(true);
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
			setError(msg);
			toast({
				type: "error",
				message: msg,
			});
			setOtp("");
		} finally {
			setLoading(false);
		}
	}, [email, otp, onOpenChange, onSuccess]);

	const handleResend = useCallback(async () => {
		if (countdown > 0) return;

		setLoading(true);
		setError("");
		setOtp("");

		try {
			const res = await fetch("/api/admin/auth/resend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "otp", email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					setCountdown(data.lockRemaining || data.countdown);
				}
				const msg = data.error || "Could not resend code";
				setError(msg);
				toast({ type: "error", message: msg });
				return;
			}

			setCountdown(2 * 60 * 1000);
			toast({
				type: "success",
				message: "Code resent",
				description: `New code sent to ${email}`,
			});
		} catch {
			const msg = "Connection failed. Try again.";
			setError(msg);
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email, countdown]);

	useEffect(() => {
		if (!sent || countdown <= 0) return;
		const interval = setInterval(() => {
			setCountdown((prev) => Math.max(0, prev - 1000));
		}, 1000);
		return () => clearInterval(interval);
	}, [sent, countdown]);

	useEffect(() => {
		if (!open) {
			setEmail("");
			setOtp("");
			setError("");
			setSent(false);
			setCountdown(0);
			setRemainingAttempts(null);
			setVerified(false);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md shadow-lg">
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
									setEmail(e.target.value);
									setError("");
								}}
								autoComplete="email"
								className="-webkit-font-smoothing antialiased h-11 rounded-md ring-1 ring-transparent focus-within:ring-[--system-accent]/30 transition-[ring-color,box-shadow] duration-150"
							/>
							{error && (
								<p className="text-xs text-destructive flex items-center gap-1">
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
											<p className="text-sm text-muted-foreground">
												We&apos;ve sent a verification code to:{" "}
												<span className="font-medium text-foreground">
													{email}
												</span>
											</p>
										</div>

										<div className="w-full flex flex-col gap-3">
											<div className="flex justify-center">
												<InputOTP
													value={otp}
													onChange={setOtp}
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
												<p className="text-xs text-destructive flex items-center justify-center gap-1">
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
													<span>Verifying...</span>
												</span>
											) : (
												<span className="flex items-center gap-2">
													<HugeiconsIcon icon={FlashIcon} className="size-4" />
													Verify
												</span>
											)}
										</Button>

										<div className="flex items-center gap-4 w-full">
											<div className="flex-1 h-px bg-border" />
											<span className="text-xs text-muted-foreground">
												Didn&apos;t receive it?
											</span>
											<div className="flex-1 h-px bg-border" />
										</div>

										<div className="flex items-center justify-between w-full">
											<p
												className={cn(
													"text-sm text-muted-foreground",
													countdownStyles,
												)}
											>
												{countdown > 0 ? (
													<span className="font-medium text-foreground tabular-nums">
														{formatCountdown(countdown)}
													</span>
												) : (
													<span className="text-foreground flex items-center gap-1">
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
										<p className="text-lg font-medium text-foreground">
											You&apos;re in!
										</p>
										<p className="text-sm text-muted-foreground animate-pulse">
											Redirecting...
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
									<span>PaperPlaneing...</span>
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
