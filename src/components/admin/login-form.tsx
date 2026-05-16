"use client";

import { m } from "framer-motion";
import { startTransition, useCallback, useState } from "react";
import { MagicLinkDialog } from "@/components/admin/login-dialogs";
import { OTPDialog } from "@/components/auth/otp-dialog";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			<div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background -webkit-font-smoothing antialiased">
				<Anim>
					<div className="w-full max-w-sm flex flex-col gap-6">
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
							<div className="text-center mb-8">
								<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
								<p className="text-sm text-muted-foreground mt-1">
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
							<form onSubmit={handleSubmit}>
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
												className="w-full h-11 px-4 rounded-lg border border-border/80 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[--system-accent] focus:ring-offset-2 transition-[border-color,box-shadow]"
												placeholder="admin@lumni.co.za"
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
												className="w-full h-11 px-4 rounded-lg border border-border/80 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[--system-accent] focus:ring-offset-2 transition-[border-color,box-shadow]"
												placeholder="••••••••"
											/>
										</div>
										<Button
											size="default"
											className="w-full rounded-lg font-medium text-sm bg-[--system-accent] hover:bg-[--system-accent]/90 text-white shadow-level-2 transition-[transform,opacity] active:scale-[0.96]"
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
								<div className="flex-1 h-px bg-border" />
								<span className="text-xs text-muted-foreground uppercase tracking-wider">
									Or
								</span>
								<div className="flex-1 h-px bg-border" />
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
							<p className="text-xs text-muted-foreground text-center mt-6">
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
