"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Loader2,
	Mail,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react";
import {
	startTransition,
	useCallback,
	useEffect,
	useState,
	ViewTransition,
} from "react";
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

const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

const otpSendSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type AuthDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (isAdmin: boolean) => void;
};

function formatCountdown(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

const buttonStyles =
	"active:scale-[0.96] transition-transform duration-150 ease-out";
const countdownStyles = "tabular-nums";
const iconStyles = "transition-all duration-200 ease-out";

function LoadingDots() {
	return (
		<span className="inline-flex gap-0.5">
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "0ms" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "150ms" }}
			/>
			<span
				className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
				style={{ animationDelay: "300ms" }}
			/>
		</span>
	);
}

function SuccessBadge({ isAdmin }: { isAdmin: boolean }) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		setShow(true);
		const timer = setTimeout(() => setShow(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<ViewTransition enter="vt-fade-in" default="none">
			<div className="absolute -top-1 -right-1 animate-bounce">
				<ViewTransition enter="vt-scale-in" default="none">
					<div className="relative">
						<div className="absolute inset-0 animate-ping opacity-75">
							<Sparkles className="h-4 w-4 text-amber-400" />
						</div>
						<Sparkles className="h-4 w-4 text-amber-500 relative z-10" />
					</div>
				</ViewTransition>
			</div>
			<ViewTransition enter="vt-fade-in" default="none">
				<div className="absolute -bottom-1 -right-1">
					<span
						className={cn(
							"flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium animate-bounce",
							isAdmin
								? "bg-green-500/20 text-green-500"
								: "bg-blue-500/20 text-blue-500",
						)}
						style={{ animationDelay: "100ms" }}
					>
						<Zap className="h-3 w-3" />
						{isAdmin ? "Admin" : "Welcome"}
					</span>
				</div>
			</ViewTransition>
		</ViewTransition>
	);
}

export function MagicLinkDialog({
	open,
	onOpenChange,
	onSuccess,
}: AuthDialogProps) {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [countdown, setCountdown] = useState(0);

	const handleSubmit = useCallback(async () => {
		const result = magicLinkSchema.safeParse({ email });
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
			const res = await fetch("/api/admin/auth/magic-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					setCountdown(data.lockRemaining || data.countdown);
				}
				const msg = data.error || "Could not send magic link";
				setError(msg);
				toast({ type: "error", message: msg });
				return;
			}

			setSent(true);
			setCountdown(2 * 60 * 1000);
			toast({
				type: "success",
				message: "Check your inbox",
				description: `Magic link sent to ${email}`,
			});
		} catch {
			const msg = "Connection failed. Try again.";
			setError(msg);
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email]);

	const handleResend = useCallback(async () => {
		if (countdown > 0) return;

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/auth/resend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "magic-link", email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					setCountdown(data.lockRemaining || data.countdown);
				}
				const msg = data.error || "Could not resend link";
				setError(msg);
				toast({ type: "error", message: msg });
				return;
			}

			setCountdown(2 * 60 * 1000);
			toast({
				type: "success",
				message: "Link resent",
				description: `Check your inbox for a new link`,
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
			setError("");
			setSent(false);
			setCountdown(0);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md shadow-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5 text-primary" />
						Sign in with Magic Link
					</DialogTitle>
					<DialogDescription>
						{sent
							? "Check your email for the sign-in link"
							: "Enter your email to receive a sign-in link"}
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
								className="-webkit-font-smoothing antialiased h-11 rounded-md ring-1 ring-transparent focus-within:ring-primary/30 transition-all"
							/>
							{error && (
								<p className="text-xs text-destructive flex items-center gap-1">
									<AlertCircle className="h-3 w-3" />
									{error}
								</p>
							)}
						</div>
					) : (
						<ViewTransition
							enter="vt-fade-in"
							exit="vt-fade-out"
							default="none"
						>
							<div className="flex flex-col items-center gap-4 py-4">
								<div className="relative">
									<ViewTransition enter="vt-scale-in" default="none">
										<div className="rounded-full bg-green-500/10 p-4">
											<CheckCircle2 className="h-12 w-12 text-green-500" />
										</div>
									</ViewTransition>
									<SuccessBadge isAdmin={false} />
								</div>

								<div className="text-center space-y-2">
									<p className="font-medium text-foreground text-lg">
										Magic link sent!
									</p>
									<p className="text-sm text-muted-foreground">
										We&apos;ve sent a sign-in link to:{" "}
										<span className="font-medium">{email}</span>
									</p>
								</div>

								<ViewTransition enter="vt-fade-in" default="none">
									<div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
										<p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
											<Clock className="h-4 w-4" />
											<span className="font-medium">
												Link expires in 15 minutes
											</span>
										</p>
									</div>
								</ViewTransition>

								{error && (
									<p className="text-xs text-destructive flex items-center gap-1">
										<AlertCircle className="h-3 w-3" />
										{error}
									</p>
								)}

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
												<span className="ml-2">Resend Magic Link</span>
											</>
										)}
									</Button>
								</div>
							</div>
						</ViewTransition>
					)}

					{!sent && (
						<Button
							onClick={handleSubmit}
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
									Send Magic Link
								</span>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

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
								className="-webkit-font-smoothing antialiased h-11 rounded-md ring-1 ring-transparent focus-within:ring-primary/30 transition-all"
							/>
							{error && (
								<p className="text-xs text-destructive flex items-center gap-1">
									<AlertCircle className="h-3 w-3" />
									{error}
								</p>
							)}
						</div>
					) : (
						<ViewTransition
							enter="vt-fade-in"
							exit="vt-fade-out"
							default="none"
						>
							<div className="flex flex-col items-center gap-4 py-2">
								{!verified && (
									<>
										<div className="relative">
											<ViewTransition enter="vt-scale-in" default="none">
												<div className="rounded-full bg-green-500/10 p-3">
													<CheckCircle2 className="h-8 w-8 text-green-500" />
												</div>
											</ViewTransition>
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
									<ViewTransition enter="vt-fade-in" default="none">
										<div className="flex flex-col items-center gap-4 py-8">
											<div className="relative">
												<ViewTransition enter="vt-scale-in" default="none">
													<div className="rounded-full bg-green-500/20 p-6">
														<CheckCircle2 className="h-16 w-16 text-green-500" />
													</div>
												</ViewTransition>
												<SuccessBadge isAdmin={true} />
											</div>
											<p className="text-lg font-medium text-foreground">
												You&apos;re in!
											</p>
											<p className="text-sm text-muted-foreground animate-pulse">
												Redirecting...
											</p>
										</div>
									</ViewTransition>
								)}
							</div>
						</ViewTransition>
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
