import { domAnimation, LazyMotion, m } from "framer-motion";
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

	const handleSend = useCallback(async () => {
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
						<ShieldCheck className="h-5 w-5 text-primary" />
						Sign in with Email OTP
					</DialogTitle>
					<DialogDescription>
						{sent
							? "Enter the verification code from your email"
							: "Enter your email to receive a verification code"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{!sent ? (
						<div className="space-y-2">
							<Input
								type="email"
								placeholder="email@example.com"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									setError("");
								}}
								autoComplete="email"
								className="-webkit-font-smoothing antialiased h-11 rounded-md ring-1 ring-transparent focus-within:ring-primary/30 transition-[ring-color,box-shadow] duration-150"
							/>
							{error && (
								<p className="text-xs text-destructive flex items-center gap-1">
									<AlertCircle className="h-3 w-3" />
									{error}
								</p>
							)}
						</div>
					) : (
						<LazyMotion features={domAnimation}>
							<m.div
								className="flex flex-col items-center gap-4 py-2"
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: {
										duration: 0.3,
										ease: [0.4, 0, 0.2, 1],
									},
								}}
								exit={{
									opacity: 0,
									y: -8,
									transition: {
										duration: 0.2,
										ease: [0.4, 0, 1, 1],
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
												<div className="rounded-full bg-green-500/10 p-3">
													<CheckCircle2 className="h-8 w-8 text-green-500" />
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

										<div className="w-full space-y-3">
											<div className="flex justify-center">
												<InputOTP
													value={otp}
													onChange={setOtp}
													error={
														remainingAttempts !== null && remainingAttempts < 3
													}
													onComplete={handleVerify}
												/>
											</div>

											{error && (
												<p className="text-xs text-destructive flex items-center justify-center gap-1">
													<AlertCircle className="h-3 w-3" />
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
													<Zap className="h-4 w-4" />
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
													<span className="text-primary flex items-center gap-1">
														<Zap className="h-3 w-3" />
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
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<>
														<RefreshCw
															className={cn(
																"h-4 w-4",
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
												<div className="rounded-full bg-green-500/20 p-6">
													<CheckCircle2 className="h-16 w-16 text-green-500" />
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
						</LazyMotion>
					)}

					{!sent && (
						<Button
							onClick={handleSend}
							disabled={loading || !email}
							className={cn("w-full", buttonStyles)}
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<LoadingDots />
									<span>Sending...</span>
								</span>
							) : (
								<span className="flex items-center gap-2">
									<Zap className="h-4 w-4" />
									Send OTP
								</span>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
