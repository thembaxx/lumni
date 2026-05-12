import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/lib/utils/storage";

interface NotificationsTabProps {
	notifications: NotificationSettings;
	onNotificationsChange: (settings: NotificationSettings) => void;
}

export function NotificationsTab({
	notifications,
	onNotificationsChange,
}: NotificationsTabProps) {
	return (
		<ListSection
			header="Notifications"
			footer="Manage your notification preferences"
		>
			<ListCell
				title="Study Reminders"
				subtitle="Get reminded to study daily"
				trailing={
					<Switch
						checked={notifications.studyReminders}
						onCheckedChange={(checked) =>
							onNotificationsChange({
								...notifications,
								studyReminders: checked,
							})
						}
					/>
				}
			/>
			<ListCell
				title="Streak Alerts"
				subtitle="Notify when streak is at risk"
				trailing={
					<Switch
						checked={notifications.streakAlerts}
						onCheckedChange={(checked) =>
							onNotificationsChange({
								...notifications,
								streakAlerts: checked,
							})
						}
					/>
				}
			/>
			<ListCell
				title="Achievement Notifications"
				subtitle="Notify when you unlock achievements"
				trailing={
					<Switch
						checked={notifications.achievementNotifications}
						onCheckedChange={(checked) =>
							onNotificationsChange({
								...notifications,
								achievementNotifications: checked,
							})
						}
					/>
				}
			/>
			<ListCell
				title="Weekly Progress"
				subtitle="Receive weekly progress summary"
				showSeparator={false}
				trailing={
					<Switch
						checked={notifications.weeklyProgress}
						onCheckedChange={(checked) =>
							onNotificationsChange({
								...notifications,
								weeklyProgress: checked,
							})
						}
					/>
				}
			/>
		</ListSection>
	);
}
