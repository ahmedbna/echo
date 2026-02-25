// app/index.tsx
import React, { useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Avatar } from '@/components/ui/avatar';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const NUM_COLUMNS = 2;
const CARD_GAP = 12;
const SHADOW_HEIGHT = 5;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

type Topic = Doc<'topics'>;

const TopicCard = ({
  item,
  index,
  cardWidth,
  onPress,
}: {
  item: Topic;
  index: number;
  cardWidth: number;
  onPress: () => void;
}) => {
  const pressed = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]) },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={{ width: cardWidth, marginBottom: 16 }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 15 });
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 15 });
        }}
        style={{ paddingBottom: SHADOW_HEIGHT }}
      >
        {/* Shadow layer */}
        <View style={[styles.cardShadow, { width: cardWidth }]} />

        {/* Face layer */}
        <Animated.View style={[styles.cardFace, faceStyle]}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useQuery(api.users.get, {});
  const topics = useQuery(api.topics.get);
  const seedTopics = useMutation(api.topics.seedTopics);
  const seededRef = useRef(false);

  // Auto-seed default topics if the list is empty
  useEffect(() => {
    if (topics !== undefined && topics.length === 0 && !seededRef.current) {
      seededRef.current = true;
      seedTopics({}).catch(console.error);
    }
  }, [topics]);

  if (topics === undefined || user === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (user === null) {
    return (
      <View style={styles.center}>
        <Text>User not found</Text>
      </View>
    );
  }

  // Compute card width based on screen
  // We use onLayout on the list container; until then use a safe default
  const PADDING = 16;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAD40B' }}>
      {/* Top nav */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button
          variant='ghost'
          style={{
            padding: 0,
            paddingHorizontal: 0,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => {}}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 62, height: 62 }}
            contentFit='contain'
          />
          <Text
            variant='heading'
            style={{ color: '#000', fontSize: 32, marginLeft: -6 }}
          >
            Orca
          </Text>
        </Button>

        {/* <Avatar
          size={42}
          image={user?.image}
          name={user?.name}
          onPress={() => router.push('/profile')}
        /> */}
      </View>

      {/* Subtitle */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={styles.subtitle}>Choose a topic to join a room</Text>
      </View>

      {/* Topic grid */}
      {topics.length === 0 ? (
        <View style={styles.center}>
          <Spinner size='lg' variant='circle' color='#000' />
        </View>
      ) : (
        <FlatList
          data={topics}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item._id as string}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          columnWrapperStyle={{ gap: CARD_GAP }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            // Safe card width calculation: subtract padding and gap
            const cardWidth = (340 - CARD_GAP) / 2; // fallback, will use flex
            return (
              <TopicCard
                item={item}
                index={index}
                cardWidth={cardWidth}
                onPress={() => router.push(`/rooms/${item._id}`)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAD40B',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  cardShadow: {
    position: 'absolute',
    top: SHADOW_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    backgroundColor: '#C4A800',
  },
  cardFace: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.07)',
    gap: 8,
    minHeight: 130,
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 38,
  },
  cardTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardDesc: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
