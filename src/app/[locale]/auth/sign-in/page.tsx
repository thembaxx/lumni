"use client";

import {
	Mail01Icon,
	SparklesIcon,
	ViewIcon,
	ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

function safeRedirect(url: string | null): string {
	if (!url) return "/dashboard";
	if (!url.startsWith("/") || url.startsWith("//")) return "/dashboard";
	if (url.includes("://") || url.includes("@")) return "/dashboard";
	return url;
}

type SignInState = {
	email: string;
	password: string;
	showPassword: boolean;
	isMagicLink: boolean;
	magicLinkSent: boolean;
	loading: boolean;
};

type SignInAction =
	| { type: "SET_EMAIL"; payload: string }
	| { type: "SET_PASSWORD"; payload: string }
	| { type: "TOGGLE_SHOW_PASSWORD" }
	| { type: "TOGGLE_MAGIC_LINK" }
	| { type: "MAGIC_LINK_SENT" }
	| { type: "RESET_MAGIC_LINK" }
	| { type: "SET_LOADING"; payload: boolean };

const initialState: SignInState = {
	email: "",
	password: "",
	showPassword: false,
	isMagicLink: false,
	magicLinkSent: false,
	loading: false,
};

function signInReducer(state: SignInState, action: SignInAction): SignInState {
	switch (action.type) {
		case "SET_EMAIL":
			return { ...state, email: action.payload };
		case "SET_PASSWORD":
			return { ...state, password: action.payload };
		case "TOGGLE_SHOW_PASSWORD":
			return { ...state, showPassword: !state.showPassword };
		case "TOGGLE_MAGIC_LINK":
			return { ...state, isMagicLink: !state.isMagicLink };
		case "MAGIC_LINK_SENT":
			return { ...state, magicLinkSent: true };
		case "RESET_MAGIC_LINK":
			return { ...state, magicLinkSent: false };
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		default:
			return state;
	}
}

function SignInForm() {
	const { push, refresh } = useRouter();
	const searchParams = useSearchParams();
	const redirect = safeRedirect(searchParams.get("redirect"));
	const { signIn, signInWithMagicLink, error } = useAuth();

	const [state, dispatch] = useReducer(signInReducer, initialState);
	const { email, password, showPassword, isMagicLink, magicLinkSent, loading } =
		state;
	const t = useTranslations();

	const handleSignIn = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			dispatch({ type: "SET_LOADING", payload: true });
			try {
				if (isMagicLink) {
					await signInWithMagicLink(email);
					dispatch({ type: "MAGIC_LINK_SENT" });
				} else {
					await signIn(email, password);
					push(redirect);
					refresh();
				}
			} catch {
			} finally {
				dispatch({ type: "SET_LOADING", payload: false });
			}
		},
		[
			email,
			password,
			isMagicLink,
			signIn,
			signInWithMagicLink,
			push,
			redirect,
			refresh,
		],
	);

	if (magicLinkSent) {
		return (
			<m.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: iOSEase }}
				className="flex flex-col items-center gap-6 text-center"
			>
				<div className="flex size-16 items-center justify-center rounded-full bg-system-accent/10">
					<HugeiconsIcon
						icon={SparklesIcon}
						className="size-8 text-system-accent"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="ios-title-2 font-semibold text-foreground">
						{t("auth.checkEmail")}
					</h1>
					<p className="ios-subhead text-muted-foreground leading-relaxed">
						{t.rich("auth.magicLinkSent", {
							email,
							strong: (chunks) => (
								<strong className="text-foreground">{chunks}</strong>
							),
						})}
					</p>
				</div>
				<button
					type="button"
					onClick={() => dispatch({ type: "RESET_MAGIC_LINK" })}
					className="font-semibold text-sm text-system-accent hover:underline"
				>
					{t("auth.useDifferentEmail")}
				</button>
			</m.div>
		);
	}

	return (
		<m.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSignIn}
			className="flex flex-col gap-8"
			suppressHydrationWarning
		>
			<div className="flex flex-col gap-2">
				<h1 className="ios-title-2 font-semibold text-foreground">
					{t("auth.signInTitle")}
				</h1>
				<p className="ios-subhead text-muted-foreground">
					{t("auth.welcomeBack")}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="email"
						className="ios-footnote font-semibold text-foreground"
					>
						{t("auth.emailLabel")}
					</label>
					<div className="relative" suppressHydrationWarning>
						<HugeiconsIcon
							icon={Mail01Icon}
							className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="email"
							type="email"
							placeholder={t("auth.emailPlaceholder")}
							value={email}
							onChange={(e) =>
								dispatch({ type: "SET_EMAIL", payload: e.target.value })
							}
							required
							className="h-11 rounded-xl border-border/40 bg-system-surface pl-10"
						/>
					</div>
				</div>

				{!isMagicLink && (
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="password"
							className="ios-footnote font-semibold text-foreground"
						>
							{t("auth.passwordLabel")}
						</label>
						<div className="relative" suppressHydrationWarning>
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder={t("auth.passwordPlaceholder")}
								value={password}
								onChange={(e) =>
									dispatch({ type: "SET_PASSWORD", payload: e.target.value })
								}
								required
								className="h-11 rounded-xl border-border/40 bg-system-surface pr-10"
							/>
							<button
								type="button"
								aria-label={
									showPassword ? t("auth.hidePassword") : t("auth.showPassword")
								}
								onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
								className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{showPassword ? (
									<HugeiconsIcon icon={ViewOffIcon} className="size-4" />
								) : (
									<HugeiconsIcon icon={ViewIcon} className="size-4" />
								)}
							</button>
						</div>
					</div>
				)}

				{error && (
					<p className="ios-footnote font-medium text-destructive">{error}</p>
				)}

				<Button
					type="submit"
					disabled={loading || !email}
					className="h-11 w-full rounded-xl bg-system-accent font-semibold text-sm text-white transition-[background-color,transform] hover:bg-system-accent/90 active:scale-[0.96]"
				>
					{loading
						? t("auth.signingIn")
						: isMagicLink
							? t("auth.sendMagicLink")
							: t("auth.signIn")}
				</Button>

				<button
					type="button"
					onClick={() => {
						dispatch({ type: "TOGGLE_MAGIC_LINK" });
						dispatch({ type: "SET_PASSWORD", payload: "" });
					}}
					className="text-center font-medium text-sm text-system-accent hover:underline"
				>
					{isMagicLink
						? t("auth.signInWithPassword")
						: t("auth.sendMagicLinkLabel")}
				</button>
			</div>

			<p className="text-center text-muted-foreground text-sm">
				{t("auth.noAccount")}{" "}
				<Link
					href={`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`}
					className="font-semibold text-system-accent hover:underline"
				>
					{t("auth.signUp")}
				</Link>
			</p>
		</m.form>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<SignInForm />
		</Suspense>
	);
}
