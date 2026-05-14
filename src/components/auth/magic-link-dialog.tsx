import {
	ArrowsClockwise,
	CheckCircle,
	Clock,
	Envelope,
	Lightning,
	Sparkle,
	Spinner,
	WarningCircle,
} from "@phosphor-icons/react";
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { buttonStyles, countdownStyles, iconStyles } from "./auth-styles";
import { formatCountdown } from "./countdown-utils";
import { LoadingDots } from "./loading-dots";
import { SuccessBadge } from "./success-badge";

const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type AuthDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: (isAdmin: boolean) => void;
};

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
			const msg = "Unable to connect. Check your internet and try again.";
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
				message: "Link sent",
				description: `Check your inbox for a new sign-in link`,
			});
		} catch {
			const msg = "Unable to connect. Check your internet and try again.";
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
						<Envelope className="size-5 text-foreground" />
						Sign in with Magic Link
					</DialogTitle>
					<DialogDescription>
						{sent
							? "Check your email for the sign-in link"
							: "Enter your email to receive a sign-in link"}
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
									<WarningCircle className="size-3" />
									{error}
								</p>
							)}
						</div>
					) : (
						<Anim>
							<m.div
								className="flex flex-col items-center gap-4 py-4"
								initial={{ opacity: 0, y: 10 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: {
										duration: 0.3,
										ease: iOSEase,
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
										<div className="rounded-full bg-success/10 p-4">
											<CheckCircle className="size-12 text-success" />
										</div>
									</m.div>
									<SuccessBadge isAdmin={false} />
								</div>

								<div className="text-center flex flex-col gap-2">
									<p className="font-medium text-foreground text-lg">
										Magic link sent!
									</p>
									<p className="text-sm text-muted-foreground">
										We&apos;ve sent a sign-in link to:{" "}
										<span className="font-medium">{email}</span>
									</p>
								</div>

								<m.div
									className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-2"
									initial={{ opacity: 0, y: 6 }}
									animate={{
										opacity: 1,
										y: 0,
										transition: {
											duration: 0.3,
											delay: 0.12,
											ease: iOSEase,
										},
									}}
								>
									<p className="text-sm text-warning-foreground flex items-center gap-2">
										<Clock className="size-4" />
										<span className="font-medium">
											Link expires in 15 minutes
										</span>
									</p>
								</m.div>

								{error && (
									<p className="text-xs text-destructive flex items-center gap-1">
										<WarningCircle className="size-3" />
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
											<span className="text-foreground flex items-center gap-1">
												<Lightning className="size-3" />
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
											<Spinner className="size-4 animate-spin" />
										) : (
											<>
												<ArrowsClockwise
													className={cn(
														"size-4",
														iconStyles,
														countdown > 0 && "animate-pulse",
													)}
												/>
												<span className="ml-2">Resend Magic Link</span>
											</>
										)}
									</Button>
								</div>
							</m.div>
						</Anim>
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
									<span>PaperPlaneing...</span>
								</span>
							) : (
								<span className="flex items-center gap-2">
									<Lightning className="size-4" />
									PaperPlane Magic Link
								</span>
							)}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
