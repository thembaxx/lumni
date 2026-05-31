"use client";

import {
	Mail01Icon,
	UserIcon,
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
import { toast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

function safeRedirect(url: string | null): string {
	if (!url) return "/dashboard";
	if (!url.startsWith("/") || url.startsWith("//")) return "/dashboard";
	if (url.includes("://") || url.includes("@")) return "/dashboard";
	return url;
}

type SignUpState = {
	name: string;
	email: string;
	password: string;
	showPassword: boolean;
	loading: boolean;
};

type SignUpAction =
	| { type: "SET_NAME"; payload: string }
	| { type: "SET_EMAIL"; payload: string }
	| { type: "SET_PASSWORD"; payload: string }
	| { type: "TOGGLE_SHOW_PASSWORD" }
	| { type: "SET_LOADING"; payload: boolean };

const initialState: SignUpState = {
	name: "",
	email: "",
	password: "",
	showPassword: false,
	loading: false,
};

function signUpReducer(state: SignUpState, action: SignUpAction): SignUpState {
	switch (action.type) {
		case "SET_NAME":
			return { ...state, name: action.payload };
		case "SET_EMAIL":
			return { ...state, email: action.payload };
		case "SET_PASSWORD":
			return { ...state, password: action.payload };
		case "TOGGLE_SHOW_PASSWORD":
			return { ...state, showPassword: !state.showPassword };
		case "SET_LOADING":
			return { ...state, loading: action.payload };
		default:
			return state;
	}
}

function SignUpForm() {
	const { push, refresh } = useRouter();
	const { get } = useSearchParams();
	const redirect = safeRedirect(get("redirect"));
	const { signUp, error } = useAuth();

	const [state, dispatch] = useReducer(signUpReducer, initialState);
	const { name, email, password, showPassword, loading } = state;
	const t = useTranslations();

	const referralCode = get("ref");

	const handleSignUp = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			dispatch({ type: "SET_LOADING", payload: true });
			try {
				const userId = await signUp(email, password, name);
				if (referralCode && userId) {
					fetch("/api/referral/claim", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ code: referralCode, refereeId: userId }),
					}).catch((e) => {
						console.warn("Referral claim:", e);
						toast({
							type: "warning",
							message:
								"Couldn't apply referral. You can add it later in Settings.",
						});
					});
				}
				push(redirect);
				refresh();
			} catch {
			} finally {
				dispatch({ type: "SET_LOADING", payload: false });
			}
		},
		[email, password, name, signUp, push, redirect, referralCode, refresh],
	);

	return (
		<m.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSignUp}
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-2">
				<h1 className="ios-title-2 font-semibold text-foreground">
					{t("auth.createAccount")}
				</h1>
				<p className="ios-subhead text-muted-foreground">
					{t("auth.signUpSubtitle")}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="name"
						className="ios-footnote font-semibold text-foreground"
					>
						{t("auth.displayNameLabel")}
					</label>
					<div className="relative">
						<HugeiconsIcon
							icon={UserIcon}
							className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="name"
							type="text"
							placeholder={t("auth.displayNamePlaceholder")}
							value={name}
							onChange={(e) =>
								dispatch({ type: "SET_NAME", payload: e.target.value })
							}
							required
							className="h-11 rounded-xl border-border/40 bg-system-surface pl-10"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="email"
						className="ios-footnote font-semibold text-foreground"
					>
						{t("auth.emailLabel")}
					</label>
					<div className="relative">
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

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="password"
						className="ios-footnote font-semibold text-foreground"
					>
						{t("auth.passwordLabel")}
					</label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder={t("auth.createPassword")}
							value={password}
							onChange={(e) =>
								dispatch({ type: "SET_PASSWORD", payload: e.target.value })
							}
							required
							minLength={8}
							className="h-11 rounded-xl border-border/40 bg-system-surface pr-10"
						/>
						<button
							type="button"
							onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
							aria-label={
								showPassword ? t("auth.hidePassword") : t("auth.showPassword")
							}
							className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showPassword ? (
								<HugeiconsIcon icon={ViewOffIcon} className="size-4" />
							) : (
								<HugeiconsIcon icon={ViewIcon} className="size-4" />
							)}
						</button>
					</div>
					<p className="ios-caption-1 mt-1 text-muted-foreground">
						{t("auth.passwordHint")}
					</p>
				</div>

				{error && (
					<p className="ios-footnote font-medium text-destructive">{error}</p>
				)}

				<Button
					type="submit"
					disabled={
						loading || !name || !email || !password || password.length < 8
					}
					className="h-11 w-full rounded-xl bg-system-accent font-semibold text-sm text-white transition-[background-color,transform] hover:bg-system-accent/90 active:scale-[0.96]"
				>
					{loading ? t("auth.creatingAccount") : t("auth.createAccount")}
				</Button>
			</div>

			<p className="text-center text-muted-foreground text-sm">
				{t("auth.hasAccount")}{" "}
				<Link
					href={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}
					className="font-semibold text-system-accent hover:underline"
				>
					{t("auth.signIn")}
				</Link>
			</p>
		</m.form>
	);
}

export default function SignUpPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<SignUpForm />
		</Suspense>
	);
}
