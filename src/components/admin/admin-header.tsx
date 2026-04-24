"use client";

import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
	onLogout: () => void;
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
	return (
		<motion.header
			className="sticky top-0 z-10 bg-background border-b px-4 py-3"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<motion.h1
						className="text-lg font-semibold"
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
					>
						Admin
					</motion.h1>
					<motion.p
						className="text-xs text-muted-foreground"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
					>
						Manage exam papers
					</motion.p>
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
