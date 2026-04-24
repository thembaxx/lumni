"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LoginForm } from "@/components/admin/login-form";

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
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showPreloader, setShowPreloader] = useState(true);

	useEffect(() => {
		const session = localStorage.getItem("admin_session");
		if (session) {
			setIsAuthenticated(true);
		}
	}, []);

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
			>
				<AdminDashboard />
			</motion.div>
		</AnimatePresence>
	);
}
