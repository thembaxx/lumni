import { ListCell, ListSection } from "@/components/ui/list-cell";
import { ProgressExport } from "./progress-export";

interface DataTabProps {
	studyPrefs: unknown;
	notifications: unknown;
	betaFeatures: unknown;
	onExport: () => void;
	onClear: () => void;
}

export function DataTab({ onExport, onClear }: DataTabProps) {
	return (
		<>
			<ListSection header="Progress Report">
				<div className="px-4 py-2">
					<ProgressExport />
				</div>
			</ListSection>
			<ListSection header="Data Management" footer="Export or clear your data">
				<ListCell
					title="Export Settings"
					subtitle="Download your preferences as JSON"
					onClick={onExport}
					trailing={
						<span className="ios-footnote text-[--system-accent] font-semibold">
							Export
						</span>
					}
				/>
				<ListCell
					title="Clear Local Data"
					subtitle="Reset all preferences to defaults"
					destructive
					onClick={onClear}
					showSeparator={false}
					trailing={
						<span className="ios-footnote text-[--system-destructive] font-semibold">
							Clear
						</span>
					}
				/>
			</ListSection>
		</>
	);
}
