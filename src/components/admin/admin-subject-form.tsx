"use client";

import { CloudUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminActionButton } from "./admin-action-button";

interface SubjectFormData {
	name: string;
	code: string;
	description: string;
	category: string;
}

interface SubjectFormProps {
	editSubject: {
		name: string;
		code: string;
		description?: string;
		category: string;
	} | null;
	formData: SubjectFormData;
	onFormDataChange: (data: SubjectFormData) => void;
	onSave: () => void;
	onCancel: () => void;
	onPreload: () => void;
	isSaving: boolean;
	isPreloading: boolean;
}

export function SubjectForm({
	editSubject,
	formData,
	onFormDataChange,
	onSave,
	onCancel,
	onPreload,
	isSaving,
	isPreloading,
}: SubjectFormProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{editSubject ? "Edit" : "Add Subject"}</CardTitle>
					<AdminActionButton
						onClick={onPreload}
						loading={isPreloading}
						variant="outline"
						icon={<HugeiconsIcon icon={CloudUploadIcon} className="size-3" />}
					>
						Preload
					</AdminActionButton>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-foreground text-sm">Name</Label>
						<m.div
							whileFocus={{ scale: 1.01 }}
							className="rounded-md ring-1 ring-transparent transition-shadow focus-within:ring-[--system-accent]/30"
						>
							<Input
								placeholder="Accounting"
								value={editSubject?.name || formData.name}
								onChange={(e) =>
									onFormDataChange({ ...formData, name: e.target.value })
								}
								className="rounded-md"
							/>
						</m.div>
					</div>
					<div className="flex flex-col gap-2">
						<Label className="font-medium text-foreground text-sm">Code</Label>
						<m.div
							whileFocus={{ scale: 1.01 }}
							className="rounded-md ring-1 ring-transparent transition-shadow focus-within:ring-[--system-accent]/30"
						>
							<Input
								placeholder="accounting"
								value={editSubject?.code || formData.code}
								onChange={(e) =>
									onFormDataChange({ ...formData, code: e.target.value })
								}
								className="rounded-md"
							/>
						</m.div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<Label className="font-medium text-foreground text-sm">
						Description
					</Label>
					<m.div
						whileFocus={{ scale: 1.01 }}
						className="rounded-md ring-1 ring-transparent transition-shadow focus-within:ring-[--system-accent]/30"
					>
						<Input
							placeholder="Brief description"
							value={editSubject?.description || formData.description}
							onChange={(e) =>
								onFormDataChange({ ...formData, description: e.target.value })
							}
							className="rounded-md"
						/>
					</m.div>
				</div>
				<div className="flex gap-2 pt-2">
					<AdminActionButton onClick={onSave} loading={isSaving}>
						{editSubject ? "Update" : "Add"}
					</AdminActionButton>
					{editSubject && (
						<AdminActionButton onClick={onCancel} variant="outline">
							Cancel
						</AdminActionButton>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
