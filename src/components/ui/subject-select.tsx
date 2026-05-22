"use client";

import {
	CheckmarkCircle01Icon,
	Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useFilteredSubjects } from "@/hooks/use-subjects";

interface SubjectSelectProps {
	value: string;
	onChange: (subject: string) => void;
	placeholder?: string;
}

export function SubjectSelect({
	value,
	onChange,
	placeholder = "Select subject",
}: SubjectSelectProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { data: subjects } = useFilteredSubjects(searchQuery);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
				setSearchQuery("");
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const handleSelect = (name: string) => {
		onChange(name);
		setOpen(false);
		setSearchQuery("");
	};

	const handleTrigger = () => {
		setOpen((prev) => !prev);
		if (!open) {
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	};

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={handleTrigger}
				className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-4 py-2.5 text-left font-medium text-foreground text-sm transition-colors hover:bg-secondary"
			>
				<span className="flex-1 truncate">
					{value || (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</span>
				<m.svg
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					className="shrink-0 text-muted-foreground"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</m.svg>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<m.div
						initial={{ opacity: 0, scale: 0.95, y: -4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -4 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="absolute z-50 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-lg"
					>
						<div className="p-2 pb-0">
							<div className="relative">
								<HugeiconsIcon
									icon={Search01Icon}
									className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									ref={inputRef}
									type="text"
									placeholder="Search subjects…"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 rounded-lg pr-4 pl-10"
								/>
							</div>
						</div>
						<div className="max-h-60 overflow-y-auto p-1">
							{subjects?.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground text-sm">
									No subjects found
								</p>
							) : (
								subjects?.map((subject) => (
									<button
										key={subject.id}
										type="button"
										onClick={() => handleSelect(subject.name)}
										className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60"
									>
										<div
											className="flex size-7 shrink-0 items-center justify-center rounded-lg"
											style={{
												backgroundColor: `${subject.color}20`,
											}}
										>
											<span
												className="font-extrabold text-xs"
												style={{ color: subject.color }}
											>
												{subject.name[0]}
											</span>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-foreground">
												{subject.name}
											</p>
											<p className="truncate text-muted-foreground text-xs">
												{subject.description}
											</p>
										</div>
										{value === subject.name && (
											<HugeiconsIcon
												icon={CheckmarkCircle01Icon}
												className="size-4 shrink-0 text-system-accent"
											/>
										)}
									</button>
								))
							)}
						</div>
					</m.div>
				)}
			</AnimatePresence>
		</div>
	);
}
