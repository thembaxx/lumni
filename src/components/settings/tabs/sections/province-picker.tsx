"use client";

import { useState } from "react";

const SOUTH_AFRICAN_PROVINCES = [
	"Eastern Cape",
	"Free State",
	"Gauteng",
	"KwaZulu-Natal",
	"Limpopo",
	"Mpumalanga",
	"Northern Cape",
	"North West",
	"Western Cape",
];

interface ProvincePickerProps {
	value: string;
	onSelect: (province: string) => void;
}

export function ProvincePicker({ value, onSelect }: ProvincePickerProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="font-medium text-sm text-system-accent hover:underline"
			>
				{value || "Select"}
			</button>
			{open && (
				<div className="absolute top-8 right-0 z-drawer max-h-48 w-48 overflow-y-auto rounded-xl bg-popover p-1 shadow-level-3 ring-1 ring-foreground/10">
					{SOUTH_AFRICAN_PROVINCES.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => {
								onSelect(p);
								setOpen(false);
							}}
							className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent ${
								value === p ? "bg-accent font-semibold" : ""
							}`}
						>
							{p}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
