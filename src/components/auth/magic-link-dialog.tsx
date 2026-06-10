"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { EmailInputForm } from "./magic-link-dialog/email-input-form";
import { ResendSection } from "./magic-link-dialog/resend-section";
import { SuccessState } from "./magic-link-dialog/success-state";

const magicLinkSchema = z.object({
	email: z.email("Please enter a valid email address"),
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
				result.error.issues[0]?.message || "Enter a valid email address";
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
				description: `Check your inbox at ${email}`,
			});
		} catch {
			const msg =
				"We couldn&apos;t connect. Check your internet and try again.";
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
				description: "Check your inbox for a new sign-in link",
			});
		} catch {
			const msg =
				"We couldn&apos;t connect. Check your internet and try again.";
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
						<EmailInputForm
							email={email}
							error={error}
							loading={loading}
							onEmailChange={(e) => {
								dispatch({ type: "SET_EMAIL", email: e });
								dispatch({ type: "SET_ERROR", error: "" });
							}}
							onSubmit={handleSubmit}
						/>
					) : (
						<>
							<SuccessState email={email} error={error} />
							<ResendSection
								countdown={countdown}
								loading={loading}
								onResend={handleResend}
							/>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
