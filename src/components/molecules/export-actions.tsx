"use client";

import { Download04Icon, FileExportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/shared";

interface ExportOption {
	id: string;
	label: string;
	format: string;
	onExport: () => void;
}

interface ExportActionsProps extends React.ComponentProps<typeof Card> {
	options: ExportOption[];
}

export function ExportActions({
	options,
	className,
	...props
}: ExportActionsProps) {
	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<HugeiconsIcon icon={FileExportIcon} size={20} />
					Export Data
				</CardTitle>
				<CardDescription>Download your progress and settings.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap gap-2">
				{options.map((option) => (
					<Button
						key={option.id}
						variant="outline"
						size="sm"
						onClick={option.onExport}
					>
						<HugeiconsIcon icon={Download04Icon} size={16} />
						{option.label}
					</Button>
				))}
			</CardContent>
		</Card>
	);
}
