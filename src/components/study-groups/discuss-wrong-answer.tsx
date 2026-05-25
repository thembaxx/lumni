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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost, useStudyGroups } from "@/hooks/use-study-groups";

interface Props {
	questionText: string;
	subject: string;
	topic?: string;
}

export function DiscussWrongAnswer({ questionText, subject, topic }: Props) {
	const t = useTranslations();
	const { data: groups } = useStudyGroups();
	const { mutate: createPost, isPending } = useCreatePost();
	const [open, setOpen] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<string>("");
	const [content, setContent] = useState("");

	const handleSubmit = () => {
		if (!selectedGroup || !content.trim()) return;
		createPost(
			{
				groupId: selectedGroup,
				content: content.trim(),
				questionText,
				subject,
				topic,
			},
			{
				onSuccess: () => {
					setContent("");
					setSelectedGroup("");
					setOpen(false);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button variant="outline" size="sm">
					<HugeiconsIcon icon={MessageAdd01Icon} data-icon="inline-start" />
					Ask Group
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Ask your study group</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="rounded-md bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
						{questionText}
					</div>

					{groups && groups.length > 0 ? (
						<Select value={selectedGroup} onValueChange={(value) => setSelectedGroup(value ?? "")}>
							<SelectTrigger>
								<SelectValue placeholder="Select a group" />
							</SelectTrigger>
							<SelectContent>
								{groups.map((g) => (
									<SelectItem key={g.$id} value={g.$id}>
										{g.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<p className="text-muted-foreground text-sm">
							You are not in any study groups.{' '}
							<a href="/study-groups" className="underline">
								Create or join one
							</a>
						</p>
					)}

					<Textarea
						placeholder="What do you want to ask?"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={3}
					/>

					<div className="flex justify-end gap-2">
						<Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!selectedGroup || !content.trim() || isPending}
						>
							{isPending ? "Posting..." : "Post to group"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
