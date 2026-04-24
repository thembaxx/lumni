"use client";

import {
	AnimatePresence,
	domAnimation,
	LazyMotion,
	m,
	motion,
} from "framer-motion";
import { Database, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";

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
		<motion.div
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
			initial={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
				<span className="text-2xl font-bold text-background">L</span>
			</div>
			<div className="w-32 h-1 bg-secondary rounded-full mt-6 overflow-hidden">
				<motion.div
					className="h-full bg-foreground"
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
				/>
			</div>
		</motion.div>
	);
}

export default function AdminPage() {
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

	if (showPreloader) {
		return <Preloader onComplete={handlePreloaderComplete} />;
	}

	if (!isAuthenticated) {
		return (
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				>
					<LoginForm onSuccess={() => setIsAuthenticated(true)} />
				</motion.div>
			</AnimatePresence>
		);
	}

	return (
		<AnimatePresence>
			<motion.div
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				initial={false}
				className="relative min-h-screen"
			>
				<motion.div
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
							<Loader2 className="size-5 animate-spin" />
						) : (
							<Database className="size-5" />
						)}
					</Button>
				</motion.div>
				<AdminDashboard />
			</motion.div>
		</AnimatePresence>
	);
}
