import { useMemo } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
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
	const studyRemindersTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.studyReminders}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						studyReminders: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const streakAlertsTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.streakAlerts}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						streakAlerts: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const achievementNotificationsTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.achievementNotifications}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						achievementNotifications: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const weeklyProgressTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.weeklyProgress}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						weeklyProgress: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);

	return (
		<ListSection
			header="Notifications"
			footer="Manage your notification preferences"
		>
			<ListCell
				title="Study Reminders"
				subtitle="Get reminded to study daily"
				trailing={studyRemindersTrailing}
			/>
			<ListCell
				title="Streak Alerts"
				subtitle="Notify when streak is at risk"
				trailing={streakAlertsTrailing}
			/>
			<ListCell
				title="Achievement Notifications"
				subtitle="Notify when you unlock achievements"
				trailing={achievementNotificationsTrailing}
			/>
			<ListCell
				title="Weekly Progress"
				subtitle="Receive weekly progress summary"
				showSeparator={false}
				trailing={weeklyProgressTrailing}
			/>
		</ListSection>
	);
}
