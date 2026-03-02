import { useRouter } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Id } from '@/convex/_generated/dataModel';
import * as Haptics from 'expo-haptics';

const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;

const YELLOW = {
  face: '#FAD40B',
  shadow: '#C4A800',
  text: '#000000',
  border: 'rgba(0,0,0,0.12)',
};

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

type Props = {
  roomId: Id<'rooms'>;
};

export const JoinRoom = ({ roomId }: Props) => {
  const router = useRouter();
  const pressed = useSharedValue(0);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return { transform: [{ translateY }] };
  });

  const handleJoinRoom = () => {
    router.push(`/rooms/room/${roomId}`);
  };

  return (
    <Pressable
      onPress={handleJoinRoom}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={{
        flex: 1,
        paddingBottom: SHADOW_HEIGHT,
      }}
    >
      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SHADOW_HEIGHT,
          bottom: 0,
          borderRadius: 24,
          backgroundColor: YELLOW.shadow,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        style={[
          {
            backgroundColor: YELLOW.face,
            borderRadius: 24,
            padding: HORIZONTAL_PADDING,
            gap: 12,
            zIndex: 2,
            borderWidth: 4,
            borderColor: YELLOW.border,
            justifyContent: 'center',
          },
          animatedFaceStyle,
        ]}
      >
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 24 }}>🤖</Text>
          <Text
            style={{
              color: YELLOW.text,
              fontSize: 18,
              fontWeight: '800',
            }}
          >
            ROOM
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};
