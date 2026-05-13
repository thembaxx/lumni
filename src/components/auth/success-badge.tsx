import { m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { Sparkles, Zap } from "lucide-react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function SuccessBadge({ isAdmin }: { isAdmin: boolean }) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		setShow(true);
		const timer = setTimeout(() => setShow(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<Anim>
			<m.div
				className="absolute -top-1 -right-1"
				initial={{ scale: 0, opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: "spring",
						stiffness: 400,
						damping: 15,
					},
				}}
				exit={{ scale: 0, opacity: 0 }}
			>
				<div className="relative">
					<div className="absolute inset-0 animate-ping opacity-75">
						<Sparkles className="h-4 w-4 text-amber-400" />
					</div>
					<Sparkles className="h-4 w-4 text-amber-500 relative z-10" />
				</div>
			</m.div>

			<m.div
				className="absolute -bottom-1 -right-1"
				initial={{ scale: 0, opacity: 0 }}
				animate={{
					scale: 1,
					opacity: 1,
					transition: {
						type: "spring",
						stiffness: 400,
						damping: 15,
						delay: 0.1,
					},
				}}
				exit={{ scale: 0, opacity: 0 }}
			>
				<span
					className={cn(
						"flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
						isAdmin
							? "bg-green-500/20 text-green-500 dark:bg-green-900/30 dark:text-green-300"
							: "bg-[--system-accent]/10 text-muted-foreground",
					)}
				>
					<Zap className="h-3 w-3" />
					{isAdmin ? "Admin" : "Welcome"}
				</span>
			</m.div>
		</Anim>
	);
}
