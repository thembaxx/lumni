"use client";

import {
	Mail01Icon,
	SparklesIcon,
	ViewIcon,
	ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

function safeRedirect(url: string | null): string {
	if (!url) return "/dashboard";
	if (!url.startsWith("/") || url.startsWith("//")) return "/dashboard";
	if (url.includes("://") || url.includes("@")) return "/dashboard";
	return url;
}

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = safeRedirect(searchParams.get("redirect"));
	const { signIn, signInWithMagicLink, error } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isMagicLink, setIsMagicLink] = useState(false);
	const [magicLinkSent, setMagicLinkSent] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSignIn = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				if (isMagicLink) {
					await signInWithMagicLink(email);
					setMagicLinkSent(true);
				} else {
					await signIn(email, password);
					router.push(redirect);
					router.refresh();
				}
			} catch {
			} finally {
				setLoading(false);
			}
		},
		[
			email,
			password,
			isMagicLink,
			signIn,
			signInWithMagicLink,
			router,
			redirect,
		],
	);

	if (magicLinkSent) {
		return (
			<motion.div
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
						CheckmarkCircle01Icon your email
					</h1>
					<p className="ios-subhead text-muted-foreground leading-relaxed">
						We sent a magic link to{" "}
						<strong className="text-foreground">{email}</strong>. Click the link
						to sign in.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setMagicLinkSent(false)}
					className="font-semibold text-sm text-system-accent hover:underline"
				>
					Use a different email
				</button>
			</motion.div>
		);
	}

	return (
		<motion.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSignIn}
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-2">
				<h1 className="ios-title-2 font-semibold text-foreground">Sign In</h1>
				<p className="ios-subhead text-muted-foreground">
					Welcome back to Lumni
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="email"
						className="ios-footnote font-semibold text-foreground"
					>
						Email
					</label>
					<div className="relative">
						<HugeiconsIcon
							icon={Mail01Icon}
							className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="email"
							type="email"
							placeholder="you@school.edu"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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
							Password
						</label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="h-11 rounded-xl border-border/40 bg-system-surface pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
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
						? "Signing in..."
						: isMagicLink
							? "Send Magic Link"
							: "Sign In"}
				</Button>

				<button
					type="button"
					onClick={() => {
						setIsMagicLink(!isMagicLink);
						setPassword("");
					}}
					className="text-center font-medium text-sm text-system-accent hover:underline"
				>
					{isMagicLink
						? "Sign in with password instead"
						: "Send me a magic link by email"}
				</button>
			</div>

			<p className="text-center text-muted-foreground text-sm">
				Don&apos;t have an account?{" "}
				<Link
					href={`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`}
					className="font-semibold text-system-accent hover:underline"
				>
					Sign up
				</Link>
			</p>
		</motion.form>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={<FormSkeleton />}>
			<SignInForm />
		</Suspense>
	);
}
