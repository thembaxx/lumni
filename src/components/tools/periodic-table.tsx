"use client";

import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import {
	AnimatePresence,
	motion,
	useSpring,
	useTransform,
} from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	elementCategoryConfig,
	elementEaseOutBack,
	elementEaseOutExpo,
	elementEaseOutQuart,
	elementEaseOutQuint,
} from "@/lib/data/element-categories";
import { type Element, elements } from "@/lib/data/elements";

const getBg = (category: string) =>
	elementCategoryConfig[category]?.bg || "bg-gray-500/90";

const ElementCard = memo(
	({
		el,
		isActive,
		onClick,
	}: {
		el: Element;
		isActive: boolean;
		onClick: () => void;
	}) => {
		const [isHovered, setIsHovered] = useState(false);
		const scale = useSpring(1, { stiffness: 400, damping: 30 });
		const glowIntensity = useSpring(0, { stiffness: 300, damping: 25 });

		useEffect(() => {
			if (isHovered && isActive) {
				glowIntensity.set(1);
			} else {
				glowIntensity.set(0);
			}
		}, [isHovered, isActive, glowIntensity]);

		const boxShadow = useTransform(
			glowIntensity,
			[0, 1],
			[
				`0 0 12px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.4)`,
				`0 0 24px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.8), 0 0 48px oklch(${elementCategoryConfig[el.category]?.rgb} / 0.4)`,
			],
		);

		const symbolScale = useTransform(glowIntensity, [0, 1], [1, 1.05]);

		return (
			<motion.button
				onClick={onClick}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				style={{ scale, boxShadow }}
				initial={{ opacity: 0, scale: 0.8, y: 10 }}
				animate={{
					opacity: isActive ? 1 : 0.15,
					scale: 1,
					y: 0,
				}}
				transition={{
					duration: 0.35,
					delay: (el.atomicNumber % 20) * 0.015,
					ease: elementEaseOutQuint,
				}}
				whileTap={isActive ? { scale: 0.95 } : {}}
				className={`
          relative flex flex-col items-center justify-center
          ${getBg(el.category)}
          rounded-2xl border border-white/10
          aspect-square p-2 cursor-pointer
        `}
			>
				<span className="absolute top-1.5 left-2 text-[10px] font-extrabold opacity-50 tabular-nums">
					{el.atomicNumber}
				</span>
				<motion.span
					style={{ scale: symbolScale }}
					className="font-extrabold text-white text-xl drop-shadow-lg"
				>
					{el.symbol}
				</motion.span>
				<span className="text-[9px] opacity-60 mt-0.5 text-center leading-tight">
					{el.name}
				</span>
				<div
					className="absolute inset-0 rounded-2xl pointer-events-none"
					style={{
						background:
							"radial-gradient(circle at 50% 0%, oklch(100% 0 0 / 0.12) 0%, transparent 50%)",
					}}
				/>
			</motion.button>
		);
	},
);

export function PeriodicTable() {
	const [selectedElement, setSelectedElement] = useState<Element | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [interestingFact, setInterestingFact] = useState<string | null>(null);

	const filteredElements = useMemo(() => {
		return elements.filter((el) => {
			const matchesSearch =
				searchQuery === "" ||
				el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.atomicNumber.toString().includes(searchQuery);
			const matchesCategory = !activeCategory || el.category === activeCategory;
			return matchesSearch && matchesCategory;
		});
	}, [searchQuery, activeCategory]);

	const isFiltered = searchQuery !== "" || activeCategory !== null;

	const _displayedElements = isFiltered ? filteredElements : elements;

	// Generate interesting fact when element is selected
	const { mutate: generateFact } = useMutation({
		mutationFn: async (el: Element) => {
			const response = await fetch(`/api/generate-element-fact`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					element: {
						atomicNumber: el.atomicNumber,
						name: el.name,
						symbol: el.symbol,
					},
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data.fact as string | null;
		},
		onSuccess: (fact) => {
			setInterestingFact(fact ?? null);
		},
		onError: (error) => {
			console.error("Failed to generate interesting fact:", error);
			setInterestingFact(null);
		},
	});

	// Reset fact when new element selected and trigger generation
	const handleElementSelect = (el: Element) => {
		setSelectedElement(el);
		setInterestingFact(null);
		if (el) {
			generateFact(el);
		}
	};

	return (
		<div
			className="h-full flex flex-col overflow-y-auto px-5"
			style={{
				backgroundImage:
					"radial-gradient(ellipse at 50% 0%, oklch(52.5% 0.142 274° / 0.08) 0%, transparent 60%)",
			}}
		>
			<div className="max-w-5xl mx-auto w-full">
				<div className="pt-5 pb-3">
					<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
						<svg
							className="size-5 text-[--system-accent]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
							<path d="M2 12h20" />
						</svg>
						Periodic Table
					</h2>
					<p className="ios-subhead text-[--system-text-secondary] mt-1">
						Explore the elements — search, filter, and learn.
					</p>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4, ease: elementEaseOutQuart }}
					className="relative mb-4"
				>
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/70"
					/>
					<Input
						type="text"
						placeholder="Search by name, symbol, or number…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						className={`
              w-full pl-12 pr-10 py-3 rounded-2xl
              bg-[--system-fill] border border-[--system-separator]
              text-foreground placeholder-muted-foreground text-sm
              focus-visible:border-[--system-accent]/50 focus-visible:ring-2 focus-visible:ring-[--system-accent]/20
              ${isSearchFocused ? "bg-[--system-background-secondary] border-[--system-accent]/30" : ""}
            `}
					/>
					{searchQuery && (
						<motion.button
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
							whileTap={{ scale: 0.95 }}
						>
							<HugeiconsIcon
								icon={Cancel01Icon}
								data-icon
								className="text-muted-foreground/70"
							/>
						</motion.button>
					)}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						delay: 0.25,
						duration: 0.35,
						ease: elementEaseOutQuart,
					}}
					className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
				>
					<motion.button
						onClick={() =>
							setActiveCategory(activeCategory === null ? null : null)
						}
						className={`
              shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-colors duration-200
              ${
								activeCategory === null
									? "bg-[--system-fill] border-[--system-separator] text-foreground"
									: "bg-[--system-fill-secondary] border-[--system-separator] text-muted-foreground hover:bg-[--system-fill]"
							}
            `}
						whileTap={{ scale: 0.95 }}
					>
						All
					</motion.button>
					{Object.entries(elementCategoryConfig).map(([key, config], index) => (
						<motion.button
							key={key}
							onClick={() =>
								setActiveCategory(activeCategory === key ? null : key)
							}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: 0.3 + index * 0.03,
								duration: 0.3,
								ease: elementEaseOutQuint,
							}}
							className={`
              shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-colors duration-200 flex items-center gap-1.5
              ${
								activeCategory === key
									? "bg-[--system-fill] border-[--system-separator] text-foreground"
									: "bg-[--system-fill-secondary] border-[--system-separator] text-muted-foreground hover:bg-[--system-fill]"
							}
            `}
							whileTap={{ scale: 0.95 }}
						>
							<motion.span
								className={`size-2.5 rounded-full ${config.bg.replace(
									"/90",
									"",
								)}`}
								animate={
									activeCategory === key ? { scale: [1, 1.3, 1] } : { scale: 1 }
								}
								transition={{ duration: 0.2 }}
							/>
							{config.label}
						</motion.button>
					))}
				</motion.div>

				<motion.div
					className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9"
					initial="hidden"
					animate="visible"
					variants={{
						visible: { transition: { staggerChildren: 0.02 } },
						hidden: {},
					}}
				>
					{elements.map((el) => (
						<ElementCard
							key={el.atomicNumber}
							el={el}
							isActive={
								!isFiltered ||
								filteredElements.some((e) => e.atomicNumber === el.atomicNumber)
							}
							onClick={() => handleElementSelect(el)}
						/>
					))}
				</motion.div>
			</div>

			<AnimatePresence initial={false}>
				{selectedElement && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: elementEaseOutQuart }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
						style={{
							background: "oklch(0% 0 0 / 0.8)",
							backdropFilter: "blur(12px)",
						}}
						onClick={() => setSelectedElement(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.85, y: 30 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.92, y: 15 }}
							transition={{
								duration: 0.4,
								ease: elementEaseOutExpo,
							}}
							onClick={(e) => e.stopPropagation()}
							className={`
                relative w-full max-w-md rounded-3xl overflow-hidden
                bg-linear-to-b from-[oklch(11.8%_0.005_264°)] to-[oklch(7.8%_0.003_264°)]
                border
              `}
							style={{
								borderColor: `oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.25)`,
								boxShadow: `0 0 80px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.2), 0 0 160px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.08)`,
							}}
						>
							<div
								className={`absolute top-0 left-0 right-0 h-1`}
								style={{
									background: `linear-gradient(90deg, oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.6), oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 1))`,
								}}
							/>

							<motion.button
								onClick={() => setSelectedElement(null)}
								className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 z-10"
								whileHover={{
									scale: 1.1,
									backgroundColor: "oklch(100% 0 0 / 0.15)",
								}}
								whileTap={{ scale: 0.95 }}
								transition={{ duration: 0.15 }}
							>
								<HugeiconsIcon icon={Cancel01Icon} data-icon />
							</motion.button>

							<div className="p-6 pt-8">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{
										delay: 0.1,
										duration: 0.35,
										ease: elementEaseOutQuint,
									}}
									className="flex items-start gap-5 mb-6"
								>
									<motion.div
										initial={{ scale: 0.8, rotate: -10 }}
										animate={{ scale: 1, rotate: 0 }}
										transition={{
											delay: 0.05,
											duration: 0.4,
											ease: elementEaseOutBack,
										}}
										className={`
                    size-20 rounded-2xl flex items-center justify-center
                    ${getBg(selectedElement.category)}
                  `}
										style={{
											boxShadow: `0 0 30px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.5), 0 0 60px oklch(${elementCategoryConfig[selectedElement.category]?.rgb} / 0.25)`,
										}}
									>
										<span className="text-3xl font-extrabold text-white">
											{selectedElement.symbol}
										</span>
									</motion.div>
									<div className="flex-1 pt-1">
										<h2 className="text-2xl font-semibold mb-1">
											{selectedElement.name}
										</h2>
										<p className="text-sm text-muted-foreground/70">
											Atomic Number {selectedElement.atomicNumber}
										</p>
										<p className="text-sm text-muted-foreground/70 tabular-nums">
											{selectedElement.atomicMass} u
										</p>
									</div>
								</motion.div>

								<div className="grid grid-cols-2 gap-3 mb-4">
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.15,
											duration: 0.3,
											ease: elementEaseOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-muted-foreground mb-1.5">
											Category
										</p>
										<p className="font-semibold text-sm">
											{elementCategoryConfig[selectedElement.category]?.label ||
												selectedElement.category}
										</p>
									</motion.div>
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.18,
											duration: 0.3,
											ease: elementEaseOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-muted-foreground mb-1.5">
											Electron Config
										</p>
										<p className="font-semibold text-sm">
											{selectedElement.electronConfig}
										</p>
									</motion.div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: 0.22,
										duration: 0.3,
										ease: elementEaseOutQuart,
									}}
									className="p-4 rounded-xl bg-white/5 border border-white/5"
								>
									<p className="text-xs text-muted-foreground mb-1.5">
										Discovery
									</p>
									<p className="font-semibold text-sm mb-1">
										{selectedElement.discoveryYear}
									</p>
									<p className="text-xs text-muted-foreground/70 leading-relaxed">
										{selectedElement.namedAfter}
									</p>
								</motion.div>

								{interestingFact && (
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.26,
											duration: 0.3,
											ease: elementEaseOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-muted-foreground mb-1.5">
											Did You Know?
										</p>
										<p className="text-sm text-muted-foreground/80 leading-relaxed">
											{interestingFact}
										</p>
									</motion.div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
