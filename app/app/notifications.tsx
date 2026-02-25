// app/(home)/notifications.tsx
import { useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChevronLeft, Bell, CheckCheck } from 'lucide-react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { PostAvatar } from '@/components/posts/post-avatar';
import { timeAgo } from '@/components/posts/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type NotificationItem = {
  _id: string;
  type: 'post_reaction' | 'post_comment' | 'comment_reaction';
  actorName: string;
  actorImage: string | null;
  postId?: string;
  postContent?: string | null;
  emoji?: string;
  read: boolean;
  _creationTime: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function notificationText(item: NotificationItem): string {
  switch (item.type) {
    case 'post_reaction':
      return `reacted ${item.emoji ?? ''} to your post`;
    case 'post_comment':
      return 'commented on your post';
    case 'comment_reaction':
      return `reacted ${item.emoji ?? ''} to your comment`;
    default:
      return 'interacted with your content';
  }
}

function notificationIcon(type: NotificationItem['type']): string {
  switch (type) {
    case 'post_reaction':
    case 'comment_reaction':
      return '✨';
    case 'post_comment':
      return '💬';
    default:
      return '🔔';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Row
// ─────────────────────────────────────────────────────────────────────────────
const NotificationRow = ({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) => (
  <TouchableOpacity
    onPress={() => onPress(item)}
    activeOpacity={0.7}
    style={[styles.row, !item.read && styles.rowUnread]}
  >
    {/* Unread dot */}
    {!item.read && <View style={styles.unreadDot} />}

    <View style={styles.iconWrapper}>
      <PostAvatar name={item.actorName} image={item.actorImage} size={40} />
      <View style={styles.typeIconBadge}>
        <Text style={{ fontSize: 11 }}>{notificationIcon(item.type)}</Text>
      </View>
    </View>

    <View style={styles.textBlock}>
      <Text style={styles.bodyText} numberOfLines={2}>
        <Text style={styles.boldText}>{item.actorName}</Text>{' '}
        {notificationText(item)}
      </Text>

      {item.postContent && (
        <Text style={styles.previewText} numberOfLines={1}>
          "{item.postContent}"
        </Text>
      )}

      <Text style={styles.timeText}>{timeAgo(item._creationTime)}</Text>
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const notifications = useQuery(api.notifications.getMyNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handlePress = useCallback(
    async (item: NotificationItem) => {
      // Mark as read
      if (!item.read) {
        await markAsRead({ notificationId: item._id as any });
      }

      // Navigate to the post
      if (item.postId) {
        router.push(`/posts/post/${item.postId}` as any);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAll = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const renderItem: ListRenderItem<NotificationItem> = ({ item }) => (
    <NotificationRow item={item as NotificationItem} onPress={handlePress} />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <ChevronLeft size={28} color='#000' strokeWidth={3} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
            <CheckCheck size={22} color='rgba(0,0,0,0.5)' strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {notifications === undefined ? (
        <View style={styles.centered}>
          <Spinner size='lg' variant='circle' color='#000' />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Bell size={52} color='rgba(0,0,0,0.15)' strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyBody}>
            When someone reacts or comments on your posts, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications as NotificationItem[]}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            gap: 6,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAD40B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  iconWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  bodyText: {
    fontSize: 14,
    color: '#111',
    lineHeight: 20,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '700',
  },
  previewText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 0, // gap handles spacing
  },
});
