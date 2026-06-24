import { ListCell, ListSection } from "@/components/ui/list-cell";
import { LabelledSwitch } from "@/components/ui/labelled-switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function NotificationsTab({ notifications, onNotificationsChange }: NotificationsTabProps) {
  return (
    <ListSection header="Notifications" footer="Manage your notification preferences">
      <LabelledSwitch
        title="Enable Notifications"
        subtitle="Master toggle for all notifications"
        checked={notifications.enabled}
        onCheckedChange={(checked) => onNotificationsChange({ ...notifications, enabled: checked })}
      />
      <LabelledSwitch
        title="Study Reminders"
        subtitle="Get reminded to study daily"
        checked={notifications.studyReminders}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, studyReminders: checked })
        }
        disabled={!notifications.enabled}
      />
      <ListCell
        title="Reminder Time"
        subtitle="Time of day for study reminders"
        trailing={
          <Select
            value={String(notifications.reminderHour)}
            disabled={!notifications.enabled}
            onValueChange={(v) =>
              onNotificationsChange({ ...notifications, reminderHour: Number(v) })
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
        }
      />
      <LabelledSwitch
        title="Streak Alerts"
        subtitle="Notify when streak is at risk"
        checked={notifications.streakAlerts}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, streakAlerts: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Quiz Reminders"
        subtitle="Get reminded about pending quizzes"
        checked={notifications.quizReminders}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, quizReminders: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Achievement Notifications"
        subtitle="Notify when you unlock achievements"
        checked={notifications.achievementNotifications}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, achievementNotifications: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Weekly Progress"
        subtitle="Receive weekly progress summary"
        checked={notifications.weeklyProgress}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, weeklyProgress: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Exam Alerts"
        subtitle="Remind you 24h before exams"
        checked={notifications.examAlerts}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, examAlerts: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Assignment Due"
        subtitle="Notify when assignments are due"
        checked={notifications.assignmentDue}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, assignmentDue: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Daily Digest"
        subtitle="Daily practice summary notification"
        checked={notifications.dailyDigest}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, dailyDigest: checked })
        }
        disabled={!notifications.enabled}
      />
      <LabelledSwitch
        title="Marketing"
        subtitle="Tips, offers, and product updates"
        showSeparator={false}
        checked={notifications.marketing}
        onCheckedChange={(checked) =>
          onNotificationsChange({ ...notifications, marketing: checked })
        }
        disabled={!notifications.enabled}
      />
    </ListSection>
  );
}
