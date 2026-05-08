import { ThemeSwitcher } from "@/components/theme";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function AppearanceTab() {
	return (
		<Card className="border-border/50 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Appearance</CardTitle>
				<CardDescription>Customize how the application looks</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4">
					<div className="space-y-1">
						<p className="text-sm font-medium">Theme</p>
						<p className="text-xs text-muted-foreground">
							Select your preferred color scheme
						</p>
					</div>
					<ThemeSwitcher />
				</div>
			</CardContent>
		</Card>
	);
}
