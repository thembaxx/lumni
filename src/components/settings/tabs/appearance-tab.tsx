import { ThemeSwitcher } from "@/components/theme";
import { ListCell, ListSection } from "@/components/ui/list-cell";

export function AppearanceTab() {
	return (
		<ListSection
			header="Appearance"
			footer="Customize how the application looks"
		>
			<ListCell
				title="Theme"
				subtitle="Select your preferred color scheme"
				trailing={<ThemeSwitcher />}
			/>
		</ListSection>
	);
}
