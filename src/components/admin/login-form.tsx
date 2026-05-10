"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import { Mail, MessageSquare } from "lucide-react";
import { startTransition, useState } from "react";
import { MagicLinkDialog } from "@/components/admin/login-dialogs";
import { OTPDialog } from "@/components/auth/otp-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const buttonStyles =
	"active:scale-[0.96] transition-transform duration-150 ease-out justify-center";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
	const [magicOpen, setMagicOpen] = useState(false);
	const [otpOpen, setOtpOpen] = useState(false);

	const handleMagicSuccess = () => {
		startTransition(() => {
			setTimeout(onSuccess, 1500);
		});
	};

	const handleOtpSuccess = () => {
		startTransition(() => {
			setTimeout(onSuccess, 1500);
		});
	};

	return (
		<>
			<div className="min-h-screen flex items-center justify-center p-4 bg-background -webkit-font-smoothing antialiased">
				<LazyMotion features={domAnimation}>
					<div className="w-full max-w-sm space-y-6">
						<m.div
							initial={{ opacity: 0, y: -12 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: {
									duration: 0.35,
									ease: [0.4, 0, 0.2, 1],
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
									ease: [0.4, 0, 0.2, 1],
								},
							}}
						>
							<Card className="shadow-lg">
								<CardContent className="p-6">
									<div className="space-y-3">
										<Button
											variant="outline"
											className={cn(
												"w-full h-12 justify-start gap-3 px-4",
												buttonStyles,
											)}
											onClick={() => setMagicOpen(true)}
										>
											<Mail className="h-5 w-5 shrink-0" />
											<span>Sign in with Magic Link</span>
										</Button>
										<Button
											variant="outline"
											className={cn(
												"w-full h-12 justify-start gap-3 px-4",
												buttonStyles,
											)}
											onClick={() => setOtpOpen(true)}
										>
											<MessageSquare className="h-5 w-5 shrink-0" />
											<span>Sign in with OTP</span>
										</Button>
									</div>
								</CardContent>
							</Card>
						</m.div>

						<m.div
							initial={{ opacity: 0 }}
							animate={{
								opacity: 1,
								transition: {
									duration: 0.4,
									delay: 0.18,
									ease: "linear",
								},
							}}
						>
							<p className="text-xs text-muted-foreground text-center mt-6">
								Authorized personnel only
							</p>
						</m.div>
					</div>
				</LazyMotion>
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
