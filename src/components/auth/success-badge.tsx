import { Lightning, Sparkle } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
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
						<Sparkle className="size-4 text-warning-foreground" />
					</div>
					<Sparkle className="size-4 text-warning relative z-10" />
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
				<Badge
					variant={isAdmin ? "default" : "secondary"}
					className={cn(
						"gap-1 px-2 text-[10px] font-medium",
						isAdmin && "bg-success/20 text-success-foreground",
					)}
				>
					<Lightning className="size-3" />
					{isAdmin ? "Admin" : "Welcome"}
				</Badge>
			</m.div>
		</Anim>
	);
}
