"use client";

import { DatabaseIcon, RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, domAnimation, m } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";
import { Toaster, ToastProvider } from "@/components/ui/toast";

function Preloader({ onComplete }: { onComplete: () => void }) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					setTimeout(onComplete, 300);
					return 100;
				}
				return prev + Math.random() * 20 + 10;
			});
		}, 60);
		return () => clearInterval(interval);
	}, [onComplete]);

	return (
		<m.div
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
			initial={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
				<span className="text-2xl font-extrabold text-background">L</span>
			</div>
			<div className="w-32 h-1 bg-secondary rounded-full mt-6 overflow-hidden">
				<m.div
					className="h-full bg-foreground"
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
				/>
			</div>
		</m.div>
	);
}

export function AdminPageClient() {
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		if (typeof window === "undefined") return false;
		return !!localStorage.getItem("admin_session");
	});
	const [showPreloader, setShowPreloader] = useState(true);
	const [isSeeding, setIsSeeding] = useState(false);
	const [seedStatus, setSeedStatus] = useState<"idle" | "success" | "error">(
		"idle",
	);

	const handleSeed = async () => {
		setIsSeeding(true);
		setSeedStatus("idle");
		try {
			const res = await fetch("/api/seed", { method: "POST" });
			const data = await res.json();
			if (data.success) {
				setSeedStatus("success");
			} else {
				setSeedStatus("error");
			}
		} catch {
			setSeedStatus("error");
		} finally {
			setIsSeeding(false);
			setTimeout(() => setSeedStatus("idle"), 3000);
		}
	};

	const handlePreloaderComplete = () => {
		setShowPreloader(false);
	};

	const handleLoginSuccess = () => {
		setIsAuthenticated(true);
	};

	if (showPreloader) {
		return <Preloader onComplete={handlePreloaderComplete} />;
	}

	return (
		<ToastProvider>
			<AnimatePresence initial={false}>
				{!isAuthenticated && (
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<LoginForm onSuccess={handleLoginSuccess} />
					</m.div>
				)}
			</AnimatePresence>

			{isAuthenticated && (
				<AnimatePresence initial={false}>
					<m.div
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						initial={false}
						className="relative min-h-[100dvh]"
					>
						<m.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="fixed bottom-6 right-6 z-50"
						>
							<Button
								size="icon-lg"
								variant={
									seedStatus === "success"
										? "secondary"
										: seedStatus === "error"
											? "destructive"
											: "default"
								}
								onClick={handleSeed}
								disabled={isSeeding}
								className="shadow-lg shadow-shadow/20 rounded-full h-14 w-14"
								title="Seed Database"
							>
								{isSeeding ? (
									<HugeiconsIcon
										icon={RadialIcon}
										className="size-5 animate-spin"
									/>
								) : (
									<HugeiconsIcon icon={DatabaseIcon} className="size-5" />
								)}
							</Button>
						</m.div>
						<AdminDashboard />
					</m.div>
				</AnimatePresence>
			)}

			<Toaster />
		</ToastProvider>
	);
}
