"use client";

import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	elementCategoryConfig,
	elementCategoryVariables,
	elementEaseOutQuart,
	elementEaseOutQuint,
} from "@/lib/data/element-categories";
import { type Element, elements } from "@/lib/data/elements";
import { logError } from "@/lib/shared/logger";
import { ElementCard } from "./element-card";
import { ElementDetailModal } from "./element-detail-modal";

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
	const queryClient = useQueryClient();

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
			queryClient.invalidateQueries({ queryKey: ["element-facts"] });
		},
		onError: (error) => {
			logError("ElementFact", error);
			setInterestingFact(null);
		},
	});

	const handleElementSelect = useCallback(
		(el: Element) => {
			setSelectedElement(el);
			setInterestingFact(null);
			if (el) {
				generateFact(el);
			}
		},
		[generateFact],
	);

	const handleCardClick = useCallback(
		(atomicNumber: number) => {
			const el = elements.find((e) => e.atomicNumber === atomicNumber);
			if (el) handleElementSelect(el);
		},
		[handleElementSelect],
	);

	return (
		<div
			className="flex h-full flex-col overflow-y-auto px-5"
			style={{
				backgroundImage:
					"radial-gradient(ellipse at 50% 0%, oklch(52.5% 0.142 274° / 0.08) 0%, transparent 60%)",
			}}
		>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS variables, no user content */}
			<style dangerouslySetInnerHTML={{ __html: elementCategoryVariables }} />
			<div className="mx-auto w-full max-w-5xl">
				<div className="pt-5 pb-3">
					<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
						<svg
							className="size-5 text-[--system-accent]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<title>Periodic table</title>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
							<path d="M2 12h20" />
						</svg>
						Periodic Table
					</h2>
					<p className="ios-subhead mt-1 text-[--system-text-secondary]">
						Explore the elements: search, filter, and learn.
					</p>
				</div>

				<m.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4, ease: elementEaseOutQuart }}
					className="relative mb-4"
				>
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground/70"
					/>
					<Input
						type="text"
						placeholder="Search by name, symbol, or number…"
						aria-label="Search periodic table elements"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						className={`w-full rounded-2xl border border-[--system-separator] bg-[--system-fill] py-3 pr-10 pl-12 text-foreground text-sm placeholder-muted-foreground focus-visible:border-[--system-accent]/50 focus-visible:ring-2 focus-visible:ring-[--system-accent]/20 ${isSearchFocused ? "border-[--system-accent]/30 bg-[--system-background-secondary]" : ""}
            `}
					/>
					{searchQuery && (
						<m.button
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
							onClick={() => setSearchQuery("")}
							className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 hover:bg-white/10 dark:hover:bg-white/20"
							whileTap={{ scale: 0.95 }}
						>
							<HugeiconsIcon
								icon={Cancel01Icon}
								data-icon
								className="text-muted-foreground/70"
							/>
						</m.button>
					)}
				</m.div>

				<m.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						delay: 0.25,
						duration: 0.35,
						ease: elementEaseOutQuart,
					}}
					className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-3"
				>
					<m.button
						onClick={() =>
							setActiveCategory(activeCategory === null ? null : null)
						}
						className={`shrink-0 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors duration-200 ${
							activeCategory === null
								? "border-[--system-separator] bg-[--system-fill] text-foreground"
								: "border-[--system-separator] bg-[--system-fill-secondary] text-muted-foreground hover:bg-[--system-fill]"
						}`}
						whileTap={{ scale: 0.95 }}
					>
						All
					</m.button>
					{Object.entries(elementCategoryConfig).map(([key, config], index) => (
						<m.button
							key={key}
							onClick={() =>
								setActiveCategory(activeCategory === key ? null : key)
							}
							aria-pressed={activeCategory === key}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: 0.3 + index * 0.03,
								duration: 0.3,
								ease: elementEaseOutQuint,
							}}
							className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-colors duration-200 ${
								activeCategory === key
									? "border-[--system-separator] bg-[--system-fill] text-foreground"
									: "border-[--system-separator] bg-[--system-fill-secondary] text-muted-foreground hover:bg-[--system-fill]"
							}`}
							whileTap={{ scale: 0.95 }}
						>
							<m.span
								className={`${config.bg} size-2.5 rounded-full`}
								animate={
									activeCategory === key ? { scale: [1, 1.3, 1] } : { scale: 1 }
								}
								transition={{ duration: 0.2 }}
							/>
							{config.label}
						</m.button>
					))}
				</m.div>

				<m.div
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
							onClick={handleCardClick}
						/>
					))}
				</m.div>
			</div>

			<ElementDetailModal
				element={selectedElement}
				interestingFact={interestingFact}
				onClose={() => setSelectedElement(null)}
			/>
		</div>
	);
}
