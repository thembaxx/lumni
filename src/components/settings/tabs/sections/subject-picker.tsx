"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

interface SubjectItem {
	id: string;
	name: string;
	category?: string;
	color: string;
}

interface SubjectPickerProps {
	enrolled: SubjectItem[];
	available: SubjectItem[];
	isEnrolled: (id: string) => boolean;
	onToggle: (id: string) => void;
}

export function SubjectPicker({
	enrolled,
	available,
	isEnrolled,
	onToggle,
}: SubjectPickerProps) {
	const [showPicker, setShowPicker] = useState(false);

	return (
		<>
			<div className="flex flex-wrap gap-2 px-1">
				{enrolled.map((subject) => (
					<span
						key={subject.id}
						className="inline-flex items-center gap-1 rounded-full bg-system-accent/10 px-3 py-1.5 font-semibold text-system-accent text-xs"
					>
						{subject.name}
						<button
							type="button"
							onClick={() => onToggle(subject.id)}
							aria-label={`Remove ${subject.name}`}
							className="ml-0.5 hover:text-destructive"
						>
							<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
						</button>
					</span>
				))}
				<button
					type="button"
					onClick={() => setShowPicker(!showPicker)}
					className="inline-flex items-center gap-1 rounded-full bg-system-fill px-3 py-1.5 font-semibold text-muted-foreground text-xs hover:bg-system-fill/80"
				>
					+ Add subject
				</button>
			</div>
			{showPicker && (
				<div className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-popover p-2 shadow-level-2 ring-1 ring-foreground/10">
					{available
						.filter((s) => !isEnrolled(s.id))
						.map((subject) => (
							<button
								key={subject.id}
								type="button"
								onClick={() => {
									onToggle(subject.id);
									setShowPicker(false);
								}}
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
							>
								<div
									className="flex size-7 shrink-0 items-center justify-center rounded-lg font-extrabold text-white text-xs"
									style={{ backgroundColor: subject.color }}
								>
									{subject.name[0]}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">{subject.name}</p>
									<p className="truncate text-muted-foreground text-xs">
										{subject.category}
									</p>
								</div>
							</button>
						))}
				</div>
			)}
		</>
	);
}
