"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { iOSAccelerate, iOSDecelerate } from "@/lib/utils/animation";

type NavState = {
	displayPathname: string;
	direction: "forward" | "back";
	gestureX: number;
};

type NavAction =
	| { type: "NAVIGATE"; pathname: string; direction: "forward" | "back" }
	| { type: "SET_GESTURE_X"; x: number };

function navReducer(state: NavState, action: NavAction): NavState {
	switch (action.type) {
		case "NAVIGATE":
			return {
				displayPathname: action.pathname,
				direction: action.direction,
				gestureX: 0,
			};
		case "SET_GESTURE_X":
			return { ...state, gestureX: action.x };
	}
}

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const { getDirection } = useNavigationDirection();
	const [navState, dispatch] = useReducer(navReducer, {
		displayPathname: pathname,
		direction: "forward" as const,
		gestureX: 0,
	});
	const [isDragging, setIsDragging] = useState(false);
	const constraintsRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		if (pathname !== navState.displayPathname) {
			dispatch({
				type: "NAVIGATE",
				pathname,
				direction: getDirection(),
			});
		}
	}, [pathname, navState.displayPathname, getDirection]);

	if (reducedMotion) {
		return <>{children}</>;
	}

	return (
		<Anim>
			<AnimatePresence mode="popLayout" initial={false}>
				<m.div
					ref={constraintsRef}
					key={navState.displayPathname}
					className="min-h-[100dvh] overflow-x-hidden"
					custom={navState.direction}
					initial={{
						opacity: 0,
						x: navState.direction === "forward" ? 80 : -80,
					}}
					animate={{
						opacity: 1,
						x: isDragging ? navState.gestureX : 0,
						transition: isDragging
							? { duration: 0 }
							: { duration: 0.35, ease: iOSDecelerate },
					}}
					exit={{
						opacity: 0,
						x: navState.direction === "forward" ? -60 : 60,
						transition: { duration: 0.2, ease: iOSAccelerate },
					}}
					drag={navState.direction === "back" ? "x" : false}
					dragConstraints={{ left: 0, right: 80 }}
					dragElastic={{ left: 0, right: 0.5 }}
					onDragStart={() => setIsDragging(true)}
					onDrag={(_, { offset }) => {
						dispatch({
							type: "SET_GESTURE_X",
							x: Math.min(offset.x, 120),
						});
					}}
					onDragEnd={(_, { offset, velocity }) => {
						setIsDragging(false);
						if (offset.x > 60 || velocity.x > 300) {
							window.history.back();
						} else {
							dispatch({ type: "SET_GESTURE_X", x: 0 });
						}
					}}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</Anim>
	);
}
