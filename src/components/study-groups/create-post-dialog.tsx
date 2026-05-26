"use client";

import { MessageAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/use-study-groups";

interface Props {
	groupId: string;
	questionText?: string;
	subject?: string;
	topic?: string;
}

export function CreatePostDialog({
	groupId,
	questionText,
	subject,
	topic,
}: Props) {
	const _t = useTranslations();
	const [open, setOpen] = useState(false);
	const [content, setContent] = useState("");
	const { mutate: createPost, isPending } = useCreatePost();

	const handleSubmit = () => {
		if (!content.trim()) return;
		createPost(
			{
				groupId,
				content: content.trim(),
				questionText,
				subject,
				topic,
			},
			{
				onSuccess: () => {
					setContent("");
					setOpen(false);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button size="sm" className="gap-2">
					<HugeiconsIcon icon={MessageAdd01Icon} className="size-4" />
					Ask Group
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ask your study group</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{questionText && (
						<div className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-sm italic">
							{questionText}
						</div>
					)}
					<Textarea
						placeholder="What do you want to ask your group?"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={4}
					/>
					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!content.trim() || isPending}
						>
							{isPending ? "Posting..." : "Post to group"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
