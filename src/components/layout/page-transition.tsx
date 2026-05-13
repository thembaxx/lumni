"use client";

import { AnimatePresence, m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { iOSEase, pageTransition } from "@/lib/utils/animation";

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

	return (
		<Anim>
			<AnimatePresence mode="popLayout" initial={false}>
				<m.div
					key={displayPathname}
					className="min-h-screen"
					initial={{
						opacity: 0,
						scale: 0.98,
						x: direction === "forward" ? 60 : -60,
					}}
					animate={{
						opacity: 1,
						scale: 1,
						x: 0,
						transition: pageTransition,
					}}
					exit={{
						opacity: 0,
						scale: 0.98,
						x: direction === "forward" ? -60 : 60,
						transition: {
							duration: 0.2,
							ease: iOSEase,
						},
					}}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</Anim>
	);
}
