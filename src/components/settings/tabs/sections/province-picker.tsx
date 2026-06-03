"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
			<Button
				variant="link"
				size="sm"
				onClick={() => setOpen(!open)}
				className="font-medium text-sm text-system-accent"
			>
				{value || "Select"}
			</Button>
			{open && (
				<div className="absolute top-8 right-0 z-drawer max-h-48 w-48 overflow-y-auto rounded-xl bg-popover p-1 shadow-level-3 ring-1 ring-foreground/10">
					{SOUTH_AFRICAN_PROVINCES.map((p) => (
						<Button
							key={p}
							variant="ghost"
							size="sm"
							onClick={() => {
								onSelect(p);
								setOpen(false);
							}}
							className={`w-full justify-start rounded-lg font-normal ${value === p ? "bg-accent font-semibold" : ""}`}
						>
							{p}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}
