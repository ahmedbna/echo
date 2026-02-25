// components/rooms/rooms.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Image } from 'expo-image';
import { ChevronLeft, Plus, Bot } from 'lucide-react-native';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoomCard } from '@/components/rooms/room-card';
import * as Haptics from 'expo-haptics';
import { NewRoom } from './new-room';

const MAX_PARTICIPANTS = 5;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

type Props = {
  user: Doc<'users'>;
  topicId: Id<'topics'>;
  topicTitle: string;
  topic: Doc<'topics'>;
};

export const Rooms = ({ user, topicId, topicTitle, topic }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rooms = useQuery(api.rooms.listByTopic, { topicId });
  const createRoom = useMutation(api.rooms.create);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (
    title: string,
    discussionTopic: string,
    agentInstructions: string,
  ) => {
    setCreating(true);
    try {
      const roomId = await createRoom({
        topicId,
        title,
        topic: discussionTopic || undefined,
        agentInstructions: agentInstructions || undefined,
      });
      setShowCreate(false);
      router.push(`/rooms/room/${roomId}`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = (roomId: string, isFull: boolean) => {
    if (isFull) {
      Alert.alert(
        'Room Full',
        `This room has reached the maximum of ${MAX_PARTICIPANTS} participants.`,
      );
      return;
    }
    router.push(`/rooms/room/${roomId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAD40B' }}>
      {/* Top navigation */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
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
          onPress={() => {
            if (router.canDismiss()) router.dismissAll();
          }}
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

      {/* Main content body */}
      <View style={[styles.body, { marginTop: insets.top + 70 }]}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ChevronLeft size={24} color='#FFF' strokeWidth={3} />
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {topicTitle}
            </Text>
          </TouchableOpacity>

          <Pressable
            onPress={() => {
              setShowCreate(true);
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={styles.newRoomBtn}>
              <Plus size={13} color='#000' strokeWidth={3} />
              <Text style={styles.newRoomBtnText}>New Room</Text>
            </View>
          </Pressable>
        </View>

        {/* AI banner */}
        <View style={styles.aiBanner}>
          <Bot size={16} color='#FAD40B' strokeWidth={2.5} />
          <Text style={styles.aiBannerText}>
            AI-moderated rooms — Orca joins every room as your language coach
          </Text>
        </View>

        {/* Room list */}
        {rooms === undefined ? (
          <View style={styles.center}>
            <Spinner size='lg' variant='circle' color='#FAD40B' />
          </View>
        ) : rooms.length === 0 ? (
          <Animated.View entering={FadeIn.delay(100)} style={styles.emptyState}>
            <Text style={{ fontSize: 72 }}>{topic.emoji}</Text>
            <View style={styles.emptyTextWrap}>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptyBody}>
                Start an AI-powered {topicTitle} discussion where Orca moderates
                and coaches everyone in real time
              </Text>
            </View>
            <View style={{ width: '80%', marginTop: 8 }}>
              <OrcaButton
                onPress={() => setShowCreate(true)}
                label='Start First Room'
                variant='yellow'
              />
            </View>
          </Animated.View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item._id as string}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <RoomCard
                item={item}
                index={index}
                onPress={() => handleJoinRoom(item._id as string, item.isFull)}
              />
            )}
            ListHeaderComponent={() =>
              rooms.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <View style={styles.liveIndicator} />
                  <Text style={styles.sectionLabel}>
                    {rooms.length} Active{' '}
                    {rooms.length === 1 ? 'Room' : 'Rooms'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      <NewRoom
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        creating={creating}
        topicEmoji={topic.emoji}
        topicTitle={topicTitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#0D0D14',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topicEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    flex: 1,
  },
  newRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAD40B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  newRoomBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250,212,11,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(250,212,11,0.12)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  aiBannerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FAD40B',
  },
  sectionLabel: {
    color: '#777',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  emptyBody: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 8,
    paddingBottom: 100,
  },
});
