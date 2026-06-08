"use client";

import { m } from "framer-motion";
import { startTransition, useCallback, useState } from "react";
import { MagicLinkDialog } from "@/components/admin/login-dialogs";
import { OTPDialog } from "@/components/auth/otp-dialog";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

const buttonStyles =
	"active:scale-[0.96] transition-transform duration-150 ease-out justify-center";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
	const [magicOpen, setMagicOpen] = useState(false);
	const [otpOpen, setOtpOpen] = useState(false);

	const handleMagicSuccess = useCallback(() => {
		startTransition(() => {
			setTimeout(onSuccess, 1500);
		});
	}, [onSuccess]);

	const handleOtpSuccess = useCallback(() => {
		startTransition(() => {
			setTimeout(onSuccess, 1500);
		});
	}, [onSuccess]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleMagicSuccess();
	};

	return (
		<>
			<div className="-webkit-font-smoothing flex min-h-dvh items-center justify-center bg-background p-4 antialiased">
				<Anim>
					<div className="flex w-full max-w-sm flex-col gap-6">
						<m.div
							initial={{ opacity: 0, y: -12 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: {
									duration: 0.35,
									ease: iOSEase,
								},
							}}
						>
							<div className="mb-8 text-center">
								<h1 className="font-semibold text-2xl tracking-tight">Admin</h1>
								<p className="mt-1 text-muted-foreground text-sm">
									Sign in to continue
								</p>
							</div>
						</m.div>

						<m.div
							initial={{ opacity: 0, y: 20 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: {
									duration: 0.35,
									delay: 0.08,
									ease: iOSEase,
								},
							}}
						>
							<form onSubmit={handleSubmit} suppressHydrationWarning>
								<Card className="shadow-lg">
									<CardContent className="flex flex-col gap-4 p-6">
										<div className="flex flex-col gap-1.5">
											<Label
												htmlFor="email"
												className="uppercase tracking-wider"
											>
												Admin Email
											</Label>
											<input
												id="email"
												type="email"
												className="h-11 w-full rounded-lg border border-border/80 bg-background px-4 text-foreground text-sm transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[--system-accent] focus:ring-offset-2"
												placeholder="admin@lumni.co.za"
												aria-label="Admin email"
											/>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label
												htmlFor="password"
												className="uppercase tracking-wider"
											>
												Password
											</Label>
											<input
												id="password"
												type="password"
												className="h-11 w-full rounded-lg border border-border/80 bg-background px-4 text-foreground text-sm transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[--system-accent] focus:ring-offset-2"
												placeholder="••••••••"
												aria-label="Admin password"
											/>
										</div>
										<Button
											size="default"
											className="w-full rounded-lg bg-[--system-accent] font-medium text-sm text-white shadow-level-2 transition-[transform,opacity] hover:bg-[--system-accent]/90 active:scale-[0.96]"
										>
											Sign In
										</Button>
									</CardContent>
								</Card>
							</form>
						</m.div>

						{/* Alternative auth options */}
						<m.div
							initial={{ opacity: 0, y: 20 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: {
									duration: 0.35,
									delay: 0.16,
									ease: iOSEase,
								},
							}}
						>
							<div className="flex items-center gap-2 pt-2">
								<div className="h-px flex-1 bg-border" />
								<span className="text-muted-foreground text-xs uppercase tracking-wider">
									Or
								</span>
								<div className="h-px flex-1 bg-border" />
							</div>
							<div className="grid grid-cols-2 gap-2 pt-2">
								<Button
									variant="outline"
									className={cn("h-10 justify-start gap-2 px-4", buttonStyles)}
									onClick={() => setMagicOpen(true)}
								>
									<span className="text-xs">Magic Link</span>
								</Button>
								<Button
									variant="outline"
									className={cn("h-10 justify-start gap-2 px-4", buttonStyles)}
									onClick={() => setOtpOpen(true)}
								>
									<span className="text-xs">OTP</span>
								</Button>
							</div>
						</m.div>

						<m.div
							initial={{ opacity: 0 }}
							animate={{
								opacity: 1,
								transition: {
									duration: 0.4,
									delay: 0.22,
									ease: "linear",
								},
							}}
						>
							<p className="mt-6 text-center text-muted-foreground text-xs">
								Authorized personnel only
							</p>
						</m.div>
					</div>
				</Anim>
			</div>

			<MagicLinkDialog
				open={magicOpen}
				onOpenChange={setMagicOpen}
				onSuccess={handleMagicSuccess}
			/>
			<OTPDialog
				open={otpOpen}
				onOpenChange={setOtpOpen}
				onSuccess={handleOtpSuccess}
			/>
		</>
	);
}
