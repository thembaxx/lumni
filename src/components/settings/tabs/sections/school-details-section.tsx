"use client";

import { MapPinIcon, Mortarboard01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { EditableField } from "@/components/settings/tabs/editable-field";
import { ProvincePicker } from "@/components/settings/tabs/sections/province-picker";
import { ListCell, ListSection } from "@/components/ui/list-cell";

interface SchoolDetailsSectionProps {
	schoolDraft: string;
	gradeDraft: string;
	provinceDraft: string;
	onSaveSchool: (value: string) => Promise<void>;
	onSaveGrade: (value: string) => Promise<void>;
	onSaveProvince: (value: string) => Promise<void>;
}

export function SchoolDetailsSection({
	schoolDraft,
	gradeDraft,
	provinceDraft,
	onSaveSchool,
	onSaveGrade,
	onSaveProvince,
}: SchoolDetailsSectionProps) {
	const schoolLeading = useMemo(
		() => <HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />,
		[],
	);
	const schoolTrailing = useMemo(
		() => (
			<EditableField
				value={schoolDraft}
				onSave={onSaveSchool}
				placeholder="Your school name"
			/>
		),
		[schoolDraft, onSaveSchool],
	);
	const gradeLeading = useMemo(
		() => <HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />,
		[],
	);
	const gradeTrailing = useMemo(
		() => (
			<EditableField
				value={gradeDraft}
				onSave={onSaveGrade}
				placeholder="e.g. Grade 12"
			/>
		),
		[gradeDraft, onSaveGrade],
	);
	const provinceLeading = useMemo(
		() => <HugeiconsIcon icon={MapPinIcon} className="size-5" />,
		[],
	);
	const provinceTrailing = useMemo(
		() => <ProvincePicker value={provinceDraft} onSelect={onSaveProvince} />,
		[provinceDraft, onSaveProvince],
	);

	return (
		<ListSection header="School Details (Optional)">
			<ListCell
				leading={schoolLeading}
				title="School"
				showSeparator
				trailing={schoolTrailing}
			/>
			<ListCell
				leading={gradeLeading}
				title="Grade"
				showSeparator
				trailing={gradeTrailing}
			/>
			<ListCell
				leading={provinceLeading}
				title="Province"
				showSeparator={false}
				trailing={provinceTrailing}
			/>
		</ListSection>
	);
}
