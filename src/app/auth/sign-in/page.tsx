"use client";

import { Envelope, Eye, EyeSlash, MagicWand } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
				<div className="size-16 rounded-full bg-system-accent/10 flex items-center justify-center">
					<MagicWand className="size-8 text-system-accent" />
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="ios-title-2 font-extrabold text-foreground">
						Check your email
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
					className="text-sm font-semibold text-system-accent hover:underline"
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
				<h1 className="ios-title-2 font-extrabold text-foreground">Sign In</h1>
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
						<Envelope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							id="email"
							type="email"
							placeholder="you@school.edu"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="pl-10 h-11 rounded-xl bg-system-surface border-border/40"
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
								className="pr-10 h-11 rounded-xl bg-system-surface border-border/40"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{showPassword ? (
									<EyeSlash className="size-4" />
								) : (
									<Eye className="size-4" />
								)}
							</button>
						</div>
					</div>
				)}

				{error && (
					<p className="ios-footnote text-destructive font-medium">{error}</p>
				)}

				<Button
					type="submit"
					disabled={loading || !email}
					className="w-full h-11 rounded-xl bg-system-accent text-white font-semibold text-sm hover:bg-system-accent/90 active:scale-[0.98] transition-all"
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
					className="text-sm font-medium text-system-accent hover:underline text-center"
				>
					{isMagicLink
						? "Sign in with password instead"
						: "Send me a magic link by email"}
				</button>
			</div>

			<p className="text-sm text-muted-foreground text-center">
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
		<Suspense fallback={null}>
			<SignInForm />
		</Suspense>
	);
}
