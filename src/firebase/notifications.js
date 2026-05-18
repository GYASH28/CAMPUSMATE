import { addDocument, updateDocument } from './firestore';

export async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  actionUrl = '',
}) {
  if (!userId || !title) return null;
  return addDocument('notifications', {
    userId,
    title,
    message,
    type,
    read: false,
    actionUrl,
  });
}

export async function markNotificationRead(notification) {
  if (!notification?.id || notification.read) return;
  await updateDocument('notifications', notification.id, { read: true });
}

export async function markManyNotificationsRead(notifications) {
  await Promise.all(
    notifications
      .filter((notification) => notification.id && !notification.read)
      .map((notification) => updateDocument('notifications', notification.id, { read: true })),
  );
}
