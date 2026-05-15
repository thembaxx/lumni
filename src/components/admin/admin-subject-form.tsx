"use client";

import { CloudArrowUp } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/shared";
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
						icon={<CloudArrowUp className="size-3" />}
					>
						Preload
					</AdminActionButton>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<Label className="text-sm font-medium text-foreground">Name</Label>
						<motion.div
							whileFocus={{ scale: 1.01 }}
							className="transition-shadow ring-1 ring-transparent focus-within:ring-[--system-accent]/30 rounded-md"
						>
							<Input
								placeholder="Accounting"
								value={editSubject?.name || formData.name}
								onChange={(e) =>
									onFormDataChange({ ...formData, name: e.target.value })
								}
								className="rounded-md"
							/>
						</motion.div>
					</div>
					<div className="flex flex-col gap-2">
						<Label className="text-sm font-medium text-foreground">Code</Label>
						<motion.div
							whileFocus={{ scale: 1.01 }}
							className="transition-shadow ring-1 ring-transparent focus-within:ring-[--system-accent]/30 rounded-md"
						>
							<Input
								placeholder="accounting"
								value={editSubject?.code || formData.code}
								onChange={(e) =>
									onFormDataChange({ ...formData, code: e.target.value })
								}
								className="rounded-md"
							/>
						</motion.div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<Label className="text-sm font-medium text-foreground">
						Description
					</Label>
					<motion.div
						whileFocus={{ scale: 1.01 }}
						className="transition-shadow ring-1 ring-transparent focus-within:ring-[--system-accent]/30 rounded-md"
					>
						<Input
							placeholder="Brief description"
							value={editSubject?.description || formData.description}
							onChange={(e) =>
								onFormDataChange({ ...formData, description: e.target.value })
							}
							className="rounded-md"
						/>
					</motion.div>
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
