"use client";

import { ContentBlockRenderer } from "@/components/exam/content-block-renderer";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/types/exam-paper";

interface SourceBasedInputProps {
	value: string | undefined;
	onChange: (value: string) => void;
	sourceRefs?: string[];
	content?: ContentBlock[] | null;
	disabled?: boolean;
}

export function SourceBasedInput({
	value = "",
	onChange,
	sourceRefs,
	content,
	disabled,
}: SourceBasedInputProps) {
	return (
		<div className="space-y-4">
			{sourceRefs && sourceRefs.length > 0 && (
				<div className="flex gap-2 flex-wrap">
					{sourceRefs.map((ref) => (
						<span
							key={ref}
							className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
						>
							Source {ref}
						</span>
					))}
				</div>
			)}
			{content?.map((block, idx) => (
				<ContentBlockRenderer key={idx} block={block} />
			))}
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Refer to the source(s) above and answer..."
				className={cn("min-h-[120px]", Boolean(sourceRefs?.length) && "mt-2")}
			/>
		</div>
	);
}