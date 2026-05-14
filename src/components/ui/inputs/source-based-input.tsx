"use client";

import { ContentBlockRenderer } from "@/components/exam/content-block-renderer";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/types/exam-paper";

interface SourceBasedInputProps {
	value?: string | undefined;
	onChange?: (value: string) => void;
	sourceRefs?: string[];
	content?: ContentBlock[] | null;
	disabled?: boolean;
}

export function SourceBasedInput({
	value = "",
	onChange = () => {},
	sourceRefs,
	content,
	disabled,
}: SourceBasedInputProps) {
	return (
		<div className="flex flex-col gap-4">
			{sourceRefs && sourceRefs.length > 0 && (
				<div className="flex gap-2 flex-wrap">
					{sourceRefs.map((ref) => (
						<Badge key={ref} variant="secondary">
							Source {ref}
						</Badge>
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
