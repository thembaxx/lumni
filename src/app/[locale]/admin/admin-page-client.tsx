"use client";

import { DatabaseIcon, RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";

function Preloader({ onComplete }: { onComplete: () => void }) {
	useEffect(() => {
		const timer = setTimeout(onComplete, 400);
		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<m.div
			className="fixed inset-0 z-modal flex flex-col items-center justify-center bg-background"
			initial={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex size-12 items-center justify-center rounded-xl bg-foreground">
				<span className="font-extrabold text-2xl text-background">L</span>
			</div>
			<div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-secondary">
				<m.div
					className="h-full w-1/2 rounded-full bg-foreground"
					initial={{ opacity: 0.4 }}
					animate={{ opacity: 1 }}
					transition={{
						duration: 0.6,
						repeat: Infinity,
						repeatType: "reverse",
					}}
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
		<>
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
						className="relative min-h-dvh"
					>
						<m.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="fixed right-6 bottom-6 z-modal"
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
								className="size-14 rounded-full shadow-lg shadow-shadow/20"
								title="Seed Database"
								aria-label="Seed Database"
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
		</>
	);
}
