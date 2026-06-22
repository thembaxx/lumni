"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";

export function ExamErrorState() {
	return (
		<m.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="grow"
		>
			<Empty className="border border-destructive/30 border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeiconsIcon
							icon={BookOpen01Icon}
							className="size-6 text-destructive"
						/>
					</EmptyMedia>
					<EmptyTitle>We hit a little snag</EmptyTitle>
					<EmptyDescription>
						We couldn&apos;t fetch your exams right now. Let&apos;s give it
						another shot!
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</m.div>
	);
}
