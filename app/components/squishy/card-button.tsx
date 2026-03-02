import { View, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';

const COLORS = {
  yellow: {
    face: '#FAD40B',
    shadow: '#E5C000',
    text: '#000000',
    border: 'rgba(0,0,0,0.1)',
  },
  white: {
    face: '#FFFFFF',
    shadow: '#D1D5DB',
    text: '#000000',
    border: 'rgba(0,0,0,0.1)',
  },
  black: {
    face: '#000000',
    shadow: '#2A2A2A',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.1)',
  },
  gray: {
    face: '#D1D5DB',
    shadow: '#AFB2B7',
    text: '#000',
    border: 'rgba(0,0,0,0.1)',
  },
  green: {
    face: '#1FD65F', // More saturated & lively
    shadow: '#18A94A', // Deeper contrast shadow
    text: '#FFFFFF', // Stays perfect
    border: 'rgba(0,0,0,0.12)',
  },
  red: {
    face: '#FF3B30',
    shadow: '#C1271D',
    text: '#FFFFFF',
    border: 'rgba(0,0,0,0.15)',
  },
  indigo: {
    face: '#5E5CE6',
    shadow: '#3F3DB8',
    text: '#FFFFFF',
    border: 'rgba(0,0,0,0.15)',
  },
} as const;

const SHADOW_HEIGHT = 6;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

type ButtonVariant = keyof typeof COLORS;

type AnimatedButtonProps = {
  label: string;
  icon: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  onPress: () => void | Promise<void>;
};

export const CardButton = ({
  label,
  icon,
  disabled = false,
  onPress,
  variant = 'red',
}: AnimatedButtonProps) => {
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);
  const colors = COLORS[disabled ? 'gray' : variant];

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={{ flex: 1, paddingBottom: SHADOW_HEIGHT }}
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
          backgroundColor: colors.shadow,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        style={[
          {
            backgroundColor: colors.face,
            borderRadius: 24,
            paddingHorizontal: 12,
            paddingVertical: 24,
            gap: 12,
            zIndex: 2,
            borderWidth: 4,
            borderColor: colors.border,
            justifyContent: 'center',
          },
          animatedFaceStyle,
        ]}
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};
