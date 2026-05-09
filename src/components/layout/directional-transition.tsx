"use client";

import { domAnimation, LazyMotion, m } from "framer-motion";
import { createContext, useContext, useState } from "react";

interface DirectionalTransitionContextValue {
	direction: "forward" | "back";
	setDirection: (dir: "forward" | "back") => void;
}

const DirectionalTransitionContext =
	createContext<DirectionalTransitionContextValue>({
		direction: "forward",
		setDirection: () => {},
	});

export function useDirectionalTransition() {
	return useContext(DirectionalTransitionContext);
}

interface DirectionalTransitionProviderProps {
	children: React.ReactNode;
}

export function DirectionalTransitionProvider({
	children,
}: DirectionalTransitionProviderProps) {
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	return (
		<DirectionalTransitionContext.Provider value={{ direction, setDirection }}>
			{children}
		</DirectionalTransitionContext.Provider>
	);
}

interface DirectionalTransitionProps {
	children: React.ReactNode;
	direction?: "forward" | "back";
}

export function DirectionalTransition({
	children,
	direction = "forward",
}: DirectionalTransitionProps) {
	const xOffset = direction === "forward" ? 40 : -40;

	return (
		<LazyMotion features={domAnimation}>
			<m.div
				initial={{ opacity: 0, x: xOffset }}
				animate={{
					opacity: 1,
					x: 0,
					transition: {
						duration: 0.25,
						delay: 0.08,
						ease: [0.25, 0.1, 0.25, 1],
					},
				}}
				exit={{
					opacity: 0,
					x: -xOffset,
					transition: {
						duration: 0.18,
						ease: [0.4, 0, 1, 1],
					},
				}}
			>
				{children}
			</m.div>
		</LazyMotion>
	);
}
