"use client";

import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGroup } from "@/hooks/use-study-groups";
import { type Subject, useSubjects } from "@/hooks/use-subjects";

export function CreateGroupDialog() {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [subjectId, setSubjectId] = useState("");
	const { data: subjectsData } = useSubjects();
	const subjects = subjectsData?.subjects ?? [];
	const { mutate: createGroup, isPending } = useCreateGroup();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		createGroup(
			{
				name: name.trim(),
				description: description.trim() || undefined,
				subjectId: subjectId || undefined,
			},
			{
				onSuccess: () => {
					setOpen(false);
					setName("");
					setDescription("");
					setSubjectId("");
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button>
					<HugeiconsIcon icon={UserAdd01Icon} className="size-4" />
					{t("studyGroups.createGroup")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("studyGroups.createGroup")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="name">
								{t("studyGroups.groupName")}
							</FieldLabel>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("studyGroups.groupNamePlaceholder")}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="description">
								{t("studyGroups.description")}
							</FieldLabel>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t("studyGroups.descriptionPlaceholder")}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="subject">
								{t("studyGroups.subject")}
							</FieldLabel>
							<Select
								value={subjectId}
								onValueChange={(value) => setSubjectId(value ?? "")}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("studyGroups.selectSubject")} />
								</SelectTrigger>
								<SelectContent>
									{subjects?.map((s: Subject) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					</FieldGroup>
					<Button type="submit" disabled={!name.trim() || isPending}>
						{isPending ? t("common.creating") : t("common.create")}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
