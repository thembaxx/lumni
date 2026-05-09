"use client";

import { motion } from "framer-motion";
import { Mail, ShieldCheck } from "lucide-react";
import { startTransition, useState, ViewTransition } from "react";
import { MagicLinkDialog, OTPDialog } from "@/components/admin/login-dialogs";
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
		// Success handled in dialog
	};

	return (
		<>
			<div className="min-h-screen flex items-center justify-center p-4 bg-background -webkit-font-smoothing antialiased">
				<div className="w-full max-w-sm space-y-6">
					<ViewTransition enter="vt-fade-in" default="none">
						<div className="text-center mb-8">
							<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
							<p className="text-sm text-muted-foreground mt-1">
								Sign in to continue
							</p>
						</div>
					</ViewTransition>

					<ViewTransition enter="vt-slide-up-in" default="none">
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
										<ShieldCheck className="h-5 w-5 shrink-0" />
										<span>Sign in with Email OTP</span>
									</Button>
								</div>
							</CardContent>
						</Card>
					</ViewTransition>

					<ViewTransition enter="vt-fade-in" default="none">
						<p className="text-xs text-muted-foreground text-center mt-6">
							Authorized personnel only
						</p>
					</ViewTransition>
				</div>
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
