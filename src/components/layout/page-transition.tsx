"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const pageVariants = {
	initial: {
		opacity: 0,
		y: 8,
	},
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			stiffness: 300,
			damping: 30,
		},
	},
	exit: {
		opacity: 0,
		y: -8,
		transition: {
			duration: 0.2,
			ease: [0.25, 1, 0.5, 1] as const,
		},
	},
};

interface PageTransitionProps {
	children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const [displayPathname, setDisplayPathname] = useState(pathname);

	useEffect(() => {
		if (pathname !== displayPathname) {
			setDisplayPathname(pathname);
		}
	}, [pathname, displayPathname]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={displayPathname}
				initial="initial"
				animate="animate"
				exit="exit"
				variants={pageVariants}
				className="min-h-screen"
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
