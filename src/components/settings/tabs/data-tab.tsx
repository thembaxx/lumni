import { DownloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
	BetaFeatures,
	NotificationSettings,
	StudyPreferences,
} from "@/lib/utils/storage";

interface DataTabProps {
	studyPrefs: StudyPreferences;
	notifications: NotificationSettings;
	betaFeatures: BetaFeatures;
	onExport: () => void;
	onClear: () => void;
}

export function DataTab({
	studyPrefs,
	notifications,
	betaFeatures,
	onExport,
	onClear,
}: DataTabProps) {
	return (
		<Card className="border-border/50 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Data Management</CardTitle>
				<CardDescription>Export or clear your data</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="rounded-lg border border-border/50 bg-card/50 p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Export Settings</p>
							<p className="text-xs text-muted-foreground">
								Download your preferences as JSON
							</p>
						</div>
						<Button variant="outline" onClick={onExport}>
							<HugeiconsIcon icon={DownloadIcon} className="mr-2 size-4" />
							Export
						</Button>
					</div>
				</div>

				<Separator />

				<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium text-destructive">
								Clear Local Data
							</p>
							<p className="text-xs text-muted-foreground">
								Reset all preferences to defaults
							</p>
						</div>
						<Button variant="destructive" onClick={onClear}>
							<Trash2 className="mr-2 size-4" />
							Clear
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
