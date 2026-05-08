import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
		<Card className="border-border/50 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Notifications</CardTitle>
				<CardDescription>Manage your notification preferences</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Study Reminders</p>
							<p className="text-xs text-muted-foreground">
								Get reminded to study daily
							</p>
						</div>
						<Switch
							checked={notifications.studyReminders}
							onCheckedChange={(checked) =>
								onNotificationsChange({
									...notifications,
									studyReminders: checked,
								})
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Streak Alerts</p>
							<p className="text-xs text-muted-foreground">
								Notify when streak is at risk
							</p>
						</div>
						<Switch
							checked={notifications.streakAlerts}
							onCheckedChange={(checked) =>
								onNotificationsChange({
									...notifications,
									streakAlerts: checked,
								})
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Achievement Notifications</p>
							<p className="text-xs text-muted-foreground">
								Notify when you unlock achievements
							</p>
						</div>
						<Switch
							checked={notifications.achievementNotifications}
							onCheckedChange={(checked) =>
								onNotificationsChange({
									...notifications,
									achievementNotifications: checked,
								})
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium">Weekly Progress</p>
							<p className="text-xs text-muted-foreground">
								Receive weekly progress summary
							</p>
						</div>
						<Switch
							checked={notifications.weeklyProgress}
							onCheckedChange={(checked) =>
								onNotificationsChange({
									...notifications,
									weeklyProgress: checked,
								})
							}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
