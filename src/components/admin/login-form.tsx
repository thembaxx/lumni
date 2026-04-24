"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ADMIN_EMAIL = "mndebele.themba@gmail.com";
const ADMIN_PASSWORD = "26vrX^S54R4M^$hFb7UofM^&^$a#sC";

interface LoginFormProps {
	onSuccess: () => void;
}

const springTransition = {
	type: "spring" as const,
	stiffness: 300,
	damping: 25,
};

export function LoginForm({ onSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [shake, setShake] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		await new Promise((r) => setTimeout(r, 600));

		if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
			localStorage.setItem("admin_session", "true");
			localStorage.setItem("admin_email", email);
			setLoading(false);
			onSuccess();
		} else {
			setLoading(false);
			setShake(true);
			setTimeout(() => setShake(false), 400);
			setError("Invalid credentials");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-background">
			<div className="w-full max-w-sm">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<div className="text-center mb-8">
						<motion.h1
							className="text-2xl font-semibold tracking-tight"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
						>
							Admin
						</motion.h1>
						<motion.p
							className="text-sm text-muted-foreground mt-1"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.15 }}
						>
							Sign in to continue
						</motion.p>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2, duration: 0.3 }}
				>
					<Card>
						<CardContent className="p-6">
							<form onSubmit={handleSubmit} className="space-y-4">
								<AnimatePresence mode="wait">
									{error && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											className="overflow-hidden"
										>
											<motion.div
												animate={
													shake
														? {
																x: [0, -8, 8, -8, 8, 0],
															}
														: {}
												}
												transition={{ duration: 0.4 }}
												className="p-3 text-sm text-destructive bg-destructive/5 rounded-lg"
											>
												{error}
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>

								<div className="space-y-2">
									<motion.label
										className="text-sm font-medium"
										htmlFor="email"
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.25 }}
									>
										Email
									</motion.label>
									<motion.div
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.3 }}
										whileFocus={{ scale: 1.01 }}
									>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
											<Input
												id="email"
												type="email"
												placeholder="admin@example.com"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												required
												autoComplete="email"
												className="pl-10"
											/>
										</div>
									</motion.div>
								</div>

								<div className="space-y-2">
									<motion.label
										className="text-sm font-medium"
										htmlFor="password"
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.35 }}
									>
										Password
									</motion.label>
									<motion.div
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.4 }}
										whileFocus={{ scale: 1.01 }}
									>
										<div className="relative">
											<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
											<Input
												id="password"
												type="password"
												placeholder="Enter password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												required
												autoComplete="current-password"
												className="pl-10"
											/>
										</div>
									</motion.div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.45 }}
								>
									<Button
										type="submit"
										className="w-full"
										disabled={loading}
										onClick={handleSubmit}
									>
										{loading ? (
											<motion.span
												className="flex items-center"
												animate={{ opacity: [1, 0.7, 1] }}
												transition={{
													duration: 1,
													repeat: Infinity,
												}}
											>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Signing in...
											</motion.span>
										) : (
											<motion.span
												className="flex items-center"
												whileHover={{ x: 4 }}
												transition={springTransition}
											>
												Sign in
												<ArrowRight className="w-4 h-4 ml-2" />
											</motion.span>
										)}
									</Button>
								</motion.div>
							</form>
						</CardContent>
					</Card>
				</motion.div>

				<motion.p
					className="text-xs text-muted-foreground text-center mt-6"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
				>
					Authorized personnel only
				</motion.p>
			</div>
		</div>
	);
}
