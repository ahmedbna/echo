import { StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeInDown,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Users, Bot, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const MAX_PARTICIPANTS = 5;
const SHADOW_HEIGHT = 6;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

type RoomParticipant = {
  _id: string;
  userId: string;
  roomId: string;
  isMuted: boolean;
  isActive: boolean;
  joinedAt: number;
  name: string;
  image: string | null;
};

type RoomWithParticipants = {
  _id: string;
  title: string;
  topic?: string;
  participants: RoomParticipant[];
  participantCount: number;
  isFull: boolean;
};

export const RoomCard = ({
  item,
  index,
  onPress,
}: {
  item: RoomWithParticipants;
  index: number;
  onPress: () => void;
}) => {
  const pressed = useSharedValue(0);

  const filledCount = item.participantCount ?? item.participants?.length ?? 0;
  const isFull = item.isFull ?? filledCount >= MAX_PARTICIPANTS;

  const animatedFace = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]) },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={{ marginBottom: 16 }}
    >
      <Pressable
        onPress={onPress}
        disabled={isFull}
        onPressIn={() => {
          if (!isFull) {
            pressed.value = withSpring(1, { damping: 15 });
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 15 });
        }}
        style={{ paddingBottom: SHADOW_HEIGHT, opacity: isFull ? 0.55 : 1 }}
      >
        {/* Shadow */}
        <View
          style={[
            styles.cardShadow,
            { backgroundColor: isFull ? '#8A8A8A' : '#C4A800' },
          ]}
        />

        {/* Face */}
        <Animated.View style={[styles.cardFace, animatedFace]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.topic ? (
                <Text style={styles.cardTopic} numberOfLines={1}>
                  {item.topic}
                </Text>
              ) : null}
            </View>

            <View style={styles.countPill}>
              <Users size={12} color='rgba(0,0,0,0.5)' />
              <Text style={styles.countText}>
                {filledCount}/{MAX_PARTICIPANTS}
              </Text>
            </View>

            {isFull ? (
              <View style={styles.fullBadge}>
                <Lock size={10} color='#555' />
                <Text style={styles.fullBadgeText}>FULL</Text>
              </View>
            ) : (
              <View style={styles.aiBadge}>
                <Bot size={10} color='#000' strokeWidth={2.5} />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Participants row */}
          <View style={styles.participantRow}>
            {/* AI avatar */}
            <View style={styles.aiAvatarWrap}>
              <View style={styles.aiAvatar}>
                <Bot size={20} color='#000' strokeWidth={2} />
              </View>
              <Text style={styles.aiLabel}>Orca AI</Text>
            </View>

            {/* Human avatars */}
            <View style={styles.avatarStack}>
              {item.participants.slice(0, 4).map((participant, i) => (
                <View
                  key={participant._id}
                  style={[
                    styles.avatarWrapper,
                    {
                      zIndex: item.participants.length - i,
                      marginLeft: i === 0 ? 0 : -18,
                    },
                  ]}
                >
                  <Avatar
                    size={44}
                    image={participant.image}
                    name={participant.name}
                    variant={
                      i === 0
                        ? 'red'
                        : i === 1
                          ? 'indigo'
                          : i === 2
                            ? 'black'
                            : 'green'
                    }
                  />
                </View>
              ))}
            </View>

            {!isFull ? (
              <View style={styles.joinPill}>
                <Bot size={13} color='#FAD40B' strokeWidth={3} />
                <Text style={styles.joinPillText}>Join Room</Text>
              </View>
            ) : (
              <View style={styles.fullPill}>
                <Lock size={11} color='rgba(0,0,0,0.4)' strokeWidth={2.5} />
                <Text style={styles.fullPillText}>Full</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SHADOW_HEIGHT,
    bottom: 0,
    borderRadius: 28,
  },
  cardFace: {
    backgroundColor: '#FAD40B',
    borderRadius: 28,
    padding: 20,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardTopic: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    color: '#FAD40B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  fullBadgeText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: -4,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiAvatarWrap: {
    alignItems: 'center',
    gap: 4,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAD40B',
    borderWidth: 2.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 0.3,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 8,
  },
  avatarWrapper: {
    borderWidth: 2.5,
    borderColor: '#FAD40B',
    borderRadius: 999,
    overflow: 'hidden',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 13,
    fontWeight: '700',
  },
  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  joinPillText: {
    color: '#FAD40B',
    fontSize: 13,
    fontWeight: '900',
  },
  fullPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  fullPillText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 13,
    fontWeight: '800',
  },
});
