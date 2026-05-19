"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { iOSAccelerate, iOSDecelerate } from "@/lib/utils/animation";

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const { getDirection } = useNavigationDirection();
	const [displayPathname, setDisplayPathname] = useState(pathname);
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	const [gestureX, setGestureX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const constraintsRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		if (pathname !== displayPathname) {
			setDirection(getDirection());
			setGestureX(0);
			setDisplayPathname(pathname);
		}
	}, [pathname, displayPathname, getDirection]);

	if (reducedMotion) {
		return <>{children}</>;
	}

	return (
		<Anim>
			<AnimatePresence mode="popLayout" initial={false}>
				<m.div
					ref={constraintsRef}
					key={displayPathname}
					className="min-h-[100dvh] overflow-x-hidden"
					custom={direction}
					initial={{
						opacity: 0,
						x: direction === "forward" ? 80 : -80,
					}}
					animate={{
						opacity: 1,
						x: isDragging ? gestureX : 0,
						transition: isDragging
							? { duration: 0 }
							: { duration: 0.35, ease: iOSDecelerate },
					}}
					exit={{
						opacity: 0,
						x: direction === "forward" ? -60 : 60,
						transition: { duration: 0.2, ease: iOSAccelerate },
					}}
					drag={direction === "back" ? "x" : false}
					dragConstraints={{ left: 0, right: 80 }}
					dragElastic={{ left: 0, right: 0.5 }}
					onDragStart={() => setIsDragging(true)}
					onDrag={(_, { offset }) => {
						setGestureX(Math.min(offset.x, 120));
					}}
					onDragEnd={(_, { offset, velocity }) => {
						setIsDragging(false);
						if (offset.x > 60 || velocity.x > 300) {
							window.history.back();
						} else {
							setGestureX(0);
						}
					}}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</Anim>
	);
}
