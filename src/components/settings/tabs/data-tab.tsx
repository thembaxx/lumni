import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useRouter } from "@/i18n/navigation";
import { ProgressExport } from "./progress-export";

interface DataTabProps {
	studyPrefs: unknown;
	notifications: unknown;
	betaFeatures: unknown;
	onExport: () => void;
	onClear: () => void;
}

const restartTrailing = (
	<span className="ios-footnote font-semibold text-[--system-destructive]">
		Restart
	</span>
);

function RestartOnboarding() {
	const { push } = useRouter();
	return (
		<ListCell
			title="Restart Onboarding"
			subtitle="Go through the setup wizard again"
			destructive
			onClick={() => {
				if (
					confirm(
						"Restart the onboarding wizard? Your settings will be preserved.",
					)
				) {
					localStorage.removeItem("lumni_has_visited");
					localStorage.removeItem("lumni_onboarding");
					push("/dashboard");
				}
			}}
			showSeparator={false}
			trailing={restartTrailing}
		/>
	);
}

const exportTrailing = (
	<span className="ios-footnote font-semibold text-[--system-accent]">
		Export
	</span>
);

const clearTrailing = (
	<span className="ios-footnote font-semibold text-[--system-destructive]">
		Clear
	</span>
);

export function DataTab({ onExport, onClear }: DataTabProps) {
	return (
		<>
			<ListSection header="Progress Report">
				<div className="px-4 py-2">
					<ProgressExport />
				</div>
			</ListSection>
			<ListSection header="Data Management" footer="Export, reset, or restart">
				<ListCell
					title="Export Settings"
					subtitle="Download your preferences as JSON"
					onClick={onExport}
					trailing={exportTrailing}
				/>
				<ListCell
					title="Clear Local Data"
					subtitle="Reset all preferences to defaults"
					destructive
					onClick={onClear}
					showSeparator={false}
					trailing={clearTrailing}
				/>
				<RestartOnboarding />
			</ListSection>
		</>
	);
}
