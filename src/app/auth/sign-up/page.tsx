"use client";

import { Envelope, Eye, EyeSlash, User } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { iOSEase } from "@/lib/utils/animation";

function SignUpForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect") || "/dashboard";
	const { signUp, error } = useAuth();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSignUp = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				await signUp(email, password, name);
				router.push(redirect);
				router.refresh();
			} catch {
			} finally {
				setLoading(false);
			}
		},
		[email, password, name, signUp, router, redirect],
	);

	return (
		<motion.form
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: iOSEase }}
			onSubmit={handleSignUp}
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-2">
				<h1 className="ios-title-2 font-extrabold text-foreground">
					Create Account
				</h1>
				<p className="ios-subhead text-muted-foreground">
					Sign up to save your progress
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="name"
						className="ios-footnote font-semibold text-foreground"
					>
						Display Name
					</label>
					<div className="relative">
						<User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							id="name"
							type="text"
							placeholder="Your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="pl-10 h-11 rounded-xl bg-system-surface border-border/40"
						/>
					</div>
				</div>

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
							placeholder="Create a password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
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
					<p className="ios-caption-1 text-muted-foreground mt-1">
						At least 8 characters
					</p>
				</div>

				{error && (
					<p className="ios-footnote text-destructive font-medium">{error}</p>
				)}

				<Button
					type="submit"
					disabled={
						loading || !name || !email || !password || password.length < 8
					}
					className="w-full h-11 rounded-xl bg-system-accent text-white font-semibold text-sm hover:bg-system-accent/90 active:scale-[0.98] transition-all"
				>
					{loading ? "Creating account..." : "Create Account"}
				</Button>
			</div>

			<p className="text-sm text-muted-foreground text-center">
				Already have an account?{" "}
				<Link
					href={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}
					className="font-semibold text-system-accent hover:underline"
				>
					Sign in
				</Link>
			</p>
		</motion.form>
	);
}

export default function SignUpPage() {
	return (
		<Suspense fallback={null}>
			<SignUpForm />
		</Suspense>
	);
}
