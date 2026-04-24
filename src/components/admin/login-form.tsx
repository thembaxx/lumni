"use client";

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

export function LoginForm({ onSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

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
			setError("Invalid credentials");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-background">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Sign in to continue
					</p>
				</div>

				<Card>
					<CardContent className="p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="p-3 text-sm text-destructive bg-destructive/5 rounded-lg">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<label className="text-sm font-medium">Email</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										type="email"
										placeholder="admin@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										autoComplete="email"
										className="pl-10"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Password</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										type="password"
										placeholder="Enter password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										autoComplete="current-password"
										className="pl-10"
									/>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Signing in...
									</>
								) : (
									<>
										Sign in
										<ArrowRight className="w-4 h-4 ml-2" />
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<p className="text-xs text-muted-foreground text-center mt-6">
					Authorized personnel only
				</p>
			</div>
		</div>
	);
}
