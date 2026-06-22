"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
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
	const searchParams = useSearchParams();
	const redirect = safeRedirect(searchParams.get("redirect"));
	const { signUp, signInWithGoogle, error } = useAuth();

	const [state, dispatch] = useReducer(signUpReducer, initialState);
	const { name, email, password, showPassword, loading } = state;
	const t = useTranslations();

	const referralCode = searchParams.get("ref");

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

				<div className="flex flex-col gap-4">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-border/40 border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-system-surface px-2 text-muted-foreground">
								{t("auth.orContinueWith")}
							</span>
						</div>
					</div>
					<Button
						type="button"
						onClick={() => signInWithGoogle()}
						className="h-11 w-full rounded-xl border border-border/40 bg-system-surface font-semibold text-foreground text-sm transition-[background-color,transform] hover:bg-system-surface/80 active:scale-[0.96]"
					>
						<svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						{t("auth.signInWithGoogle")}
					</Button>
				</div>

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
