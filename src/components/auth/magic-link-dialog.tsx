"use client";

import {
	AlertCircleIcon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	FlashIcon,
	Mail01Icon,
	RadialIcon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useEffect, useReducer, useState } from "react";
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
import { cn } from "@/lib/shared";
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

type MagicLinkForm = {
	email: string;
	error: string;
	sent: boolean;
	countdown: number;
};

type MagicLinkAction =
	| { type: "SET_EMAIL"; email: string }
	| { type: "SET_ERROR"; error: string }
	| { type: "SET_SENT" }
	| { type: "SET_COUNTDOWN"; countdown: number }
	| { type: "TICK" }
	| { type: "RESET" };

function magicLinkReducer(
	state: MagicLinkForm,
	action: MagicLinkAction,
): MagicLinkForm {
	switch (action.type) {
		case "SET_EMAIL":
			return { ...state, email: action.email };
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "SET_SENT":
			return { ...state, sent: true, countdown: 2 * 60 * 1000 };
		case "SET_COUNTDOWN":
			return { ...state, countdown: action.countdown };
		case "TICK":
			return {
				...state,
				countdown: Math.max(0, state.countdown - 1000),
			};
		case "RESET":
			return { email: "", error: "", sent: false, countdown: 0 };
	}
}

const initialState: MagicLinkForm = {
	email: "",
	error: "",
	sent: false,
	countdown: 0,
};

// TODO(react-doctor): Extract EmailInputForm into separate component (~170 lines)
// TODO(react-doctor): Extract SuccessState into separate component (~80 lines)
// TODO(react-doctor): Extract ResendSection into separate component (~60 lines)
export function MagicLinkDialog({
	open,
	onOpenChange,
	onSuccess: _onSuccess,
}: AuthDialogProps) {
	const [form, dispatch] = useReducer(magicLinkReducer, initialState);
	const { email, error, sent, countdown } = form;
	const [loading, setLoading] = useState(false);

	const handleSubmit = useCallback(async () => {
		const result = magicLinkSchema.safeParse({ email });
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
			const res = await fetch("/api/admin/auth/magic-link", {
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
				const msg = data.error || "Could not send magic link";
				dispatch({ type: "SET_ERROR", error: msg });
				toast({ type: "error", message: msg });
				return;
			}

			dispatch({ type: "SET_SENT" });
			toast({
				type: "success",
				message: "Magic link on its way!",
				description: `CheckmarkCircle01Icon your inbox at ${email}`,
			});
		} catch {
			const msg =
				"We couldn&apos;t connect. CheckmarkCircle01Icon your internet and try again.";
			dispatch({ type: "SET_ERROR", error: msg });
			toast({ type: "error", message: msg });
		} finally {
			setLoading(false);
		}
	}, [email]);

	const handleResend = useCallback(async () => {
		if (countdown > 0) return;

		setLoading(true);
		dispatch({ type: "SET_ERROR", error: "" });

		try {
			const res = await fetch("/api/admin/auth/resend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "magic-link", email }),
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				if (data.locked || data.countdown) {
					dispatch({
						type: "SET_COUNTDOWN",
						countdown: data.lockRemaining || data.countdown,
					});
				}
				const msg =
					data.error ||
					"We couldn&apos;t resend that link. Try again in a moment?";
				dispatch({ type: "SET_ERROR", error: msg });
				toast({ type: "error", message: msg });
				return;
			}

			dispatch({ type: "SET_COUNTDOWN", countdown: 2 * 60 * 1000 });
			toast({
				type: "success",
				message: "Link resent!",
				description: `CheckmarkCircle01Icon your inbox for a new sign-in link`,
			});
		} catch {
			const msg =
				"We couldn&apos;t connect. CheckmarkCircle01Icon your internet and try again.";
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
			<DialogContent className="shadow-lg sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HugeiconsIcon
							icon={Mail01Icon}
							className="size-5 text-foreground"
						/>
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
											<HugeiconsIcon
												icon={CheckmarkCircle01Icon}
												className="size-12 text-success"
											/>
										</div>
									</m.div>
									<SuccessBadge isAdmin={false} />
								</div>

								<div className="flex flex-col gap-2 text-center">
									<p className="font-medium text-foreground text-lg">
										Magic link sent!
									</p>
									<p className="text-muted-foreground text-sm">
										We&apos;ve sent a sign-in link to:{" "}
										<span className="font-medium">{email}</span>
									</p>
								</div>

								<m.div
									className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2"
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
									<p className="flex items-center gap-2 text-sm text-warning-foreground">
										<HugeiconsIcon icon={Clock01Icon} className="size-4" />
										<span className="font-medium">
											Link expires in 15 minutes
										</span>
									</p>
								</m.div>

								{error && (
									<p className="flex items-center gap-1 text-destructive text-xs">
										<HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
										{error}
									</p>
								)}

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
												<HugeiconsIcon icon={FlashIcon} className="size-3" />
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
									<span>Sending…</span>
								</span>
							) : (
								<span className="flex items-center gap-2">
									<HugeiconsIcon icon={FlashIcon} className="size-4" />
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
