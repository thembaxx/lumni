"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	elementCategoryConfig,
	elementEaseOutBack,
	elementEaseOutExpo,
	elementEaseOutQuart,
	elementEaseOutQuint,
} from "@/lib/data/element-categories";
import type { Element } from "@/lib/data/elements";

const getBg = (category: string) =>
	elementCategoryConfig[category]?.bg || "bg-gray-500/90";

interface ElementDetailModalProps {
	element: Element | null;
	interestingFact: string | null;
	onClose: () => void;
}

export function ElementDetailModal({
	element: selectedElement,
	interestingFact,
	onClose,
}: ElementDetailModalProps) {
	return (
		<Dialog open={!!selectedElement} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				showCloseButton={false}
				className="max-w-md p-0 sm:max-w-md"
			>
				<DialogTitle className="sr-only">
					{selectedElement?.name ?? "Element detail"}
				</DialogTitle>
				{selectedElement && (
					<m.div
						initial={{ opacity: 0, scale: 0.85, y: 30 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{
							duration: 0.4,
							ease: elementEaseOutExpo,
						}}
						className="relative w-full overflow-hidden rounded-3xl border-0 bg-[--system-background-secondary]"
						style={{
							borderColor: `oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.25)`,
							boxShadow: `0 0 80px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.2), 0 0 160px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.08)`,
						}}
					>
						<div
							className="absolute top-0 right-0 left-0 h-1"
							style={{
								background: `linear-gradient(90deg, oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.6), oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 1))`,
							}}
						/>

						<m.button
							onClick={onClose}
							className="absolute top-4 right-4 z-elevated rounded-xl bg-white/5 p-2 hover:bg-white/10 dark:bg-white/10 dark:hover:bg-white/15"
							whileHover={{
								scale: 1.1,
								backgroundColor: "oklch(100% 0 0 / 0.15)",
							}}
							whileTap={{ scale: 0.95 }}
							transition={{ duration: 0.15 }}
						>
							<HugeiconsIcon icon={Cancel01Icon} data-icon />
						</m.button>

						<div className="p-6 pt-8">
							<m.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{
									delay: 0.1,
									duration: 0.35,
									ease: elementEaseOutQuint,
								}}
								className="mb-6 flex items-start gap-5"
							>
								<m.div
									initial={{ scale: 0.8, rotate: -10 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{
										delay: 0.05,
										duration: 0.4,
										ease: elementEaseOutBack,
									}}
									className={`flex size-20 items-center justify-center rounded-2xl ${getBg(selectedElement.category)}`}
									style={{
										boxShadow: `0 0 30px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.5), 0 0 60px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.25)`,
									}}
								>
									<span className="font-extrabold text-3xl text-white">
										{selectedElement.symbol}
									</span>
								</m.div>
								<div className="flex-1 pt-1">
									<h2 className="mb-1 font-semibold text-2xl">
										{selectedElement.name}
									</h2>
									<p className="text-muted-foreground/70 text-sm">
										Atomic Number {selectedElement.atomicNumber}
									</p>
									<p className="text-muted-foreground/70 text-sm tabular-nums">
										{selectedElement.atomicMass} u
									</p>
								</div>
							</m.div>

							<div className="mb-4 grid grid-cols-2 gap-3">
								<m.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: 0.15,
										duration: 0.3,
										ease: elementEaseOutQuart,
									}}
									className="rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10"
								>
									<p className="mb-1.5 text-muted-foreground text-xs">
										Category
									</p>
									<p className="font-semibold text-sm">
										{elementCategoryConfig[selectedElement.category]?.label ||
											selectedElement.category}
									</p>
								</m.div>
								<m.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: 0.18,
										duration: 0.3,
										ease: elementEaseOutQuart,
									}}
									className="rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10"
								>
									<p className="mb-1.5 text-muted-foreground text-xs">
										Electron Config
									</p>
									<p className="font-semibold text-sm">
										{selectedElement.electronConfig}
									</p>
								</m.div>
							</div>

							<m.div
								initial={{ opacity: 0, y: 15 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.22,
									duration: 0.3,
									ease: elementEaseOutQuart,
								}}
								className="rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10"
							>
								<p className="mb-1.5 text-muted-foreground text-xs">
									Discovery
								</p>
								<p className="mb-1 font-semibold text-sm">
									{selectedElement.discoveryYear}
								</p>
								<p className="text-muted-foreground/70 text-xs leading-relaxed">
									{selectedElement.namedAfter}
								</p>
							</m.div>

							{interestingFact && (
								<m.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: 0.26,
										duration: 0.3,
										ease: elementEaseOutQuart,
									}}
									className="rounded-xl border border-white/5 bg-white/5 p-4 dark:border-white/10 dark:bg-white/10"
								>
									<p className="mb-1.5 text-muted-foreground text-xs">
										Did You Know?
									</p>
									<p className="text-muted-foreground/80 text-sm leading-relaxed">
										{interestingFact}
									</p>
								</m.div>
							)}
						</div>
					</m.div>
				)}
			</DialogContent>
		</Dialog>
	);
}
