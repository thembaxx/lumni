"use client";

import { motion } from "framer-motion";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
	onLogout: () => void;
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
	const isAdmin =
		typeof window !== "undefined" &&
		localStorage.getItem("admin_access") === "full";

	return (
		<motion.header
			className="sticky top-0 z-10 bg-background border-b px-4 py-3"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<motion.div
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
					>
						<h1 className="text-lg font-semibold">Admin</h1>
						<div className="flex items-center gap-2">
							<p className="text-xs text-muted-foreground">
								Manage exam papers
							</p>
							{isAdmin && (
								<motion.span
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium"
								>
									<ShieldCheck className="w-3 h-3" />
									Full Access
								</motion.span>
							)}
							{!isAdmin && (
								<motion.span
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium"
								>
									<User className="w-3 h-3" />
									Limited
								</motion.span>
							)}
						</div>
					</motion.div>
				</div>
				<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
					<Button
						variant="ghost"
						size="sm"
						onClick={onLogout}
						className="text-muted-foreground"
					>
						<LogOut className="w-4 h-4" />
					</Button>
				</motion.div>
			</div>
		</motion.header>
	);
}
