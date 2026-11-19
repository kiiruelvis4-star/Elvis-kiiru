import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const DAILY_REMINDER_ID = 400;
export const IMMEDIATE_REMINDER_ID = 401;
export const CHANNEL_ID = 'evening-milk-daily';

export type UnifiedNotifyStatus = NotificationPermission | 'unsupported';

async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Evening Milk Daily Reminder',
      description: 'Daily 4:00 PM offline reminder to log evening milk.',
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch {
    // Channel creation is only required on Android 8+
  }
}

export async function getUnifiedNotifyPermission(): Promise<UnifiedNotifyStatus> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function scheduleDailyFourPmAndroidReminder(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await ensureChannel();
    await LocalNotifications.cancel({
      notifications: [{ id: DAILY_REMINDER_ID }],
    }).catch(() => {});

    const baseNotification = {
      id: DAILY_REMINDER_ID,
      title: 'Evening milk',
      body: "It's 4:00 PM — log tonight's milk before you forget.",
      channelId: CHANNEL_ID,
      smallIcon: 'ic_stat_evening_milk',
      autoCancel: true,
    };

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            ...baseNotification,
            isExactNotification: true,
            schedule: {
              on: { hour: 16, minute: 0 },
              repeats: true,
              allowWhileIdle: true,
            },
          },
        ],
      });
    } catch {
      // Fallback to inexact alarm if exact alarm permission is restricted by OEM/user
      await LocalNotifications.schedule({
        notifications: [
          {
            ...baseNotification,
            isExactNotification: false,
            schedule: {
              on: { hour: 16, minute: 0 },
              repeats: true,
              allowWhileIdle: true,
            },
          },
        ],
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function ensureAndroidDailyReminderActive(): Promise<UnifiedNotifyStatus> {
  const perm = await getUnifiedNotifyPermission();
  if (Capacitor.isNativePlatform() && perm === 'granted') {
    try {
      const pending = await LocalNotifications.getPending();
      const hasDaily = pending.notifications.some((n) => n.id === DAILY_REMINDER_ID);
      if (!hasDaily) {
        await scheduleDailyFourPmAndroidReminder();
      }
    } catch {
      await scheduleDailyFourPmAndroidReminder();
    }
  }
  return perm;
}

export async function requestUnifiedNotifyPermission(): Promise<UnifiedNotifyStatus> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') {
        await scheduleDailyFourPmAndroidReminder();
        return 'granted';
      }
      if (res.display === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

export async function fireUnifiedNotification(title: string, body: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await getUnifiedNotifyPermission();
      if (perm !== 'granted') return;
      await ensureChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: IMMEDIATE_REMINDER_ID,
            title,
            body,
            channelId: CHANNEL_ID,
            smallIcon: 'ic_stat_evening_milk',
            autoCancel: true,
            schedule: { at: new Date(Date.now() + 250) },
          },
        ],
      });
    } catch {
      // Ignore native notification dispatch errors
    }
    return;
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) =>
        registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
        })
      )
      .catch(() => {
        try {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
        } catch {
          // Ignore notification errors in restricted contexts
        }
      });
    return;
  }
  try {
    new Notification(title, { body, icon: '/pwa-192x192.png' });
  } catch {
    // Ignore notification errors in restricted contexts
  }
}
