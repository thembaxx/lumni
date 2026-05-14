"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Search } from "lucide-react";
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
				className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 border border-border/60 hover:bg-secondary transition-colors text-sm font-medium text-foreground w-full text-left"
			>
				<span className="flex-1 truncate">
					{value || (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</span>
				<motion.svg
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					className="text-muted-foreground shrink-0"
				>
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</motion.svg>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: -4 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -4 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="absolute z-50 mt-2 w-full min-w-64 rounded-xl bg-popover border border-border/60 shadow-lg overflow-hidden"
					>
						<div className="p-2 pb-0">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
								<Input
									ref={inputRef}
									type="text"
									placeholder="Search subjects..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 pl-10 pr-4 rounded-lg text-sm"
								/>
							</div>
						</div>
						<div className="max-h-60 overflow-y-auto p-1">
							{subjects?.length === 0 ? (
								<p className="text-center text-muted-foreground py-6 text-sm">
									No subjects found
								</p>
							) : (
								subjects?.map((subject) => (
									<button
										key={subject.id}
										type="button"
										onClick={() => handleSelect(subject.name)}
										className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-secondary/60 transition-colors text-sm"
									>
										<div
											className="size-7 rounded-lg flex items-center justify-center shrink-0"
											style={{
												backgroundColor: subject.color + "20",
											}}
										>
											<span
												className="text-xs font-bold"
												style={{ color: subject.color }}
											>
												{subject.name[0]}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-foreground truncate">
												{subject.name}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{subject.description}
											</p>
										</div>
										{value === subject.name && (
											<Check className="size-4 text-system-accent shrink-0" />
										)}
									</button>
								))
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
