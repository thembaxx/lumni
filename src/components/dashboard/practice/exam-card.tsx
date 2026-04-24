"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";

interface ExamCardProps {
	exam: ExamPaper;
	delay?: number;
}

export function ExamCard({ exam, delay = 0 }: ExamCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	const handleDownload = () => {
		if (exam.localPath) {
			window.open(exam.localPath, "_blank");
		} else {
			window.open(exam.url, "_blank");
		}
	};

	return (
		<m.button
			initial="hidden"
			animate="visible"
			transition={{ delay: delay * 0.05, duration: 0.4 }}
			onClick={handleDownload}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={{ scale: 1.01, y: -2 }}
			whileTap={{ scale: 0.99 }}
			onMouseMove={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				e.currentTarget.style.setProperty("--x", `${x / rect.width}`);
				e.currentTarget.style.setProperty("--y", `${y / rect.height}`);
			}}
			style={
				{
					"--x": 0,
					"--y": 0,
				} as React.CSSProperties
			}
			className="relative w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/20 hover:from-secondary/60 hover:to-secondary/40 border border-border/40 hover:border-border/80 transition-all duration-300 text-left group overflow-hidden"
			type="button"
		>
			<div
				className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
				style={{
					background: `radial-gradient(circle at calc(50% + var(--x) * 50% + 50%) calc(50% + var(--y) * 50% + 50%), rgba(255,255,255,0.08) 0%, transparent 60%)`,
				}}
			/>
			<div className="relative z-10 flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate pr-2">
					{exam.title}
				</p>
				<div className="flex items-center gap-2 mt-1.5">
					<span className="text-xs text-muted-foreground font-medium">
						{exam.year}
					</span>
					<span className="text-xs text-muted-foreground/50">•</span>
					<span
						className={cn(
							"text-[11px] px-2 py-0.5 rounded-md font-medium",
							exam.session === "november"
								? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
								: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
						)}
					>
						{exam.session === "november" ? "Nov" : "May/Jun"}
					</span>
					{exam.language && (
						<>
							<span className="text-xs text-muted-foreground/50">•</span>
							<span className="text-xs text-muted-foreground capitalize font-medium">
								{exam.language}
							</span>
						</>
					)}
				</div>
			</div>
			<div className="relative z-10 flex items-center gap-2 ml-3">
				{exam.downloadedAt ? (
					<Badge
						variant="outline"
						className="text-[10px] h-5.5 px-2 text-muted-foreground border-border/60"
					>
						<m.svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 12 17 7" />
							<line x1="12" x2="12" y1="12" y2="17" />
						</m.svg>
						Saved
					</Badge>
				) : (
					<m.div
						animate={{ scale: isHovered ? 1.1 : 1 }}
						transition={{ duration: 0.2 }}
					>
						<m.svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 12 17 7" />
							<line x1="12" x2="12" y1="12" y2="17" />
						</m.svg>
					</m.div>
				)}
			</div>
		</m.button>
	);
}
