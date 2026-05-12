"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const { getDirection } = useNavigationDirection();
	const [displayPathname, setDisplayPathname] = useState(pathname);
	const [direction, setDirection] = useState<"forward" | "back">("forward");

	useEffect(() => {
		if (pathname !== displayPathname) {
			setDirection(getDirection());
			setDisplayPathname(pathname);
		}
	}, [pathname, displayPathname, getDirection]);

	const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

	return (
		<LazyMotion features={domAnimation}>
			<AnimatePresence mode="popLayout" initial={false}>
				<m.div
					key={displayPathname}
					className="min-h-screen"
					initial={{
						opacity: 0,
						x: direction === "forward" ? 60 : -60,
					}}
					animate={{
						opacity: 1,
						x: 0,
						transition: {
							duration: 0.25,
							ease: iOSEase,
						},
					}}
					exit={{
						opacity: 0,
						x: direction === "forward" ? -60 : 60,
						transition: {
							duration: 0.18,
							ease: iOSEase,
						},
					}}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</LazyMotion>
	);
}
