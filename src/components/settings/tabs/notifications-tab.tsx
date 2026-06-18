import { useMemo } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/lib/utils/storage";

interface NotificationsTabProps {
	notifications: NotificationSettings;
	onNotificationsChange: (settings: NotificationSettings) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
	const d = new Date();
	d.setHours(hour, 0, 0, 0);
	return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function NotificationsTab({
	notifications,
	onNotificationsChange,
}: NotificationsTabProps) {
	const enabledTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						enabled: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const studyRemindersTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.studyReminders}
				disabled={!notifications.enabled}
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
				disabled={!notifications.enabled}
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
	const quizRemindersTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.quizReminders}
				disabled={!notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						quizReminders: checked,
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
				disabled={!notifications.enabled}
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
				disabled={!notifications.enabled}
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
	const examAlertsTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.examAlerts}
				disabled={!notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						examAlerts: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const assignmentDueTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.assignmentDue}
				disabled={!notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						assignmentDue: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const marketingTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.marketing}
				disabled={!notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						marketing: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);
	const dailyDigestTrailing = useMemo(
		() => (
			<Switch
				checked={notifications.dailyDigest}
				disabled={!notifications.enabled}
				onCheckedChange={(checked) =>
					onNotificationsChange({
						...notifications,
						dailyDigest: checked,
					})
				}
			/>
		),
		[notifications, onNotificationsChange],
	);

	const reminderHourTrailing = useMemo(
		() => (
			<Select
				value={String(notifications.reminderHour)}
				disabled={!notifications.enabled}
				onValueChange={(v) =>
					onNotificationsChange({
						...notifications,
						reminderHour: Number(v),
					})
				}
			>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{HOURS.map((h) => (
						<SelectItem key={h} value={String(h)}>
							{formatHour(h)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		),
		[notifications, onNotificationsChange],
	);

	return (
		<ListSection
			header="Notifications"
			footer="Manage your notification preferences"
		>
			<ListCell
				title="Enable Notifications"
				subtitle="Master toggle for all notifications"
				trailing={enabledTrailing}
			/>
			<ListCell
				title="Study Reminders"
				subtitle="Get reminded to study daily"
				trailing={studyRemindersTrailing}
			/>
			<ListCell
				title="Reminder Time"
				subtitle="Time of day for study reminders"
				trailing={reminderHourTrailing}
			/>
			<ListCell
				title="Streak Alerts"
				subtitle="Notify when streak is at risk"
				trailing={streakAlertsTrailing}
			/>
			<ListCell
				title="Quiz Reminders"
				subtitle="Get reminded about pending quizzes"
				trailing={quizRemindersTrailing}
			/>
			<ListCell
				title="Achievement Notifications"
				subtitle="Notify when you unlock achievements"
				trailing={achievementNotificationsTrailing}
			/>
			<ListCell
				title="Weekly Progress"
				subtitle="Receive weekly progress summary"
				trailing={weeklyProgressTrailing}
			/>
			<ListCell
				title="Exam Alerts"
				subtitle="Remind you 24h before exams"
				trailing={examAlertsTrailing}
			/>
			<ListCell
				title="Assignment Due"
				subtitle="Notify when assignments are due"
				trailing={assignmentDueTrailing}
			/>
			<ListCell
				title="Daily Digest"
				subtitle="Daily practice summary notification"
				trailing={dailyDigestTrailing}
			/>
			<ListCell
				title="Marketing"
				subtitle="Tips, offers, and product updates"
				showSeparator={false}
				trailing={marketingTrailing}
			/>
		</ListSection>
	);
}
