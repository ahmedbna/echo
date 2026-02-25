// hooks/usePushNotifications.ts
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  setBadgeCount,
} from './pushNotifications';

export function usePushNotifications() {
  const router = useRouter();

  const savePushToken = useMutation(api.pushNotifications.savePushToken);

  useEffect(() => {
    // Register for push notifications and save token
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          console.log('Push token:', token);
          // Save token to Convex
          savePushToken({ pushToken: token })
            .then(() => console.log('✅ Push token saved to backend'))
            .catch((err) =>
              console.error('❌ Failed to save push token:', err),
            );
        }
      })
      .catch((err) => console.error('Error getting push token:', err));

    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // When notification is received while app is open
      (notification) => {
        console.log('📬 Notification received:', notification);

        // Update badge count
        const badge = notification.request.content.badge || 0;
        setBadgeCount(badge);
      },
      // When user taps on notification
      (response) => {
        console.log('👆 Notification tapped:', response);

        const data = response.notification.request.content.data;

        // Navigate based on notification type
        if (data?.type === 'post_reaction' || data?.type === 'post_comment') {
          if (data.postId) {
            router.push(`/posts/post/${data.postId}`);
          }
        } else if (data?.type === 'comment_reaction') {
          if (data.postId) {
            router.push(`/posts/post/${data.postId}`);
          }
        }

        // Clear badge when user taps notification
        setBadgeCount(0);
      },
    );

    return cleanup;
  }, [savePushToken, router]);

  return {
    // Expose any methods you might need
  };
}
