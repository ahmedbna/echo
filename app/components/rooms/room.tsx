// components/rooms/room.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  PermissionsAndroid,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  FadeInDown,
} from 'react-native-reanimated';
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/react-native';
import { useAgent, useSessionMessages } from '@livekit/components-react';
import { BarVisualizer } from '@livekit/react-native';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Image } from 'expo-image';
import { Mic, MicOff, Phone, Users, MessageSquare } from 'lucide-react-native';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ALL_LANGUAGES } from '@/constants/languages';
import { useRoomConnection } from '@/components/rooms/useRoomConnection';
import * as Haptics from 'expo-haptics';
import * as KeepAwake from 'expo-keep-awake';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

type RoomData = {
  _id: Id<'rooms'>;
  title: string;
  topic?: string;
  topicId: Id<'topics'>;
  hostId: Id<'users'>;
  status: 'active' | 'ended';
  startedAt: number;
  host: { _id: any; name: string; image: string | null };
  topic_data: Doc<'topics'>;
  participants: Array<{
    _id: any;
    userId: Id<'users'>;
    isMuted: boolean;
    isActive: boolean;
    joinedAt: number;
    user: { _id: any; name: string; image: string | null; lang: string };
  }>;
  participantCount: number;
  maxParticipants: number;
  isFull: boolean;
  isMuted: boolean;
  isInRoom: boolean;
};

type Props = {
  room: RoomData;
  currentUser: Doc<'users'>;
  roomId: Id<'rooms'>;
};

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Orca Room needs microphone access.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
}

async function fetchRoomToken(params: {
  roomId: string;
  topicId: string;
  userId: string;
  userName: string;
  participantMetadata?: string;
}): Promise<{ serverUrl: string; token: string; roomName: string }> {
  const endpoint = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/getRoomToken`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token fetch failed (${res.status}): ${err}`);
  }
  return res.json();
}

export const Room = ({ room, currentUser, roomId }: Props) => {
  const { participantMetadata } = useRoomConnection();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const joinRoom = useMutation(api.rooms.join);
  const leaveRoom = useMutation(api.rooms.leave);
  const router = useRouter();

  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync();
    return () => {
      KeepAwake.deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initAudio = async () => {
      const hasPerm = await requestMicPermission();
      if (!hasPerm) {
        if (!cancelled) setError('Microphone permission denied');
        return;
      }
      try {
        await AudioSession.startAudioSession();
      } catch (e) {
        console.warn('AudioSession error:', e);
      }
      if (!cancelled) setAudioReady(true);
    };
    initAudio();
    return () => {
      cancelled = true;
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (!audioReady) return;
    let cancelled = false;
    const init = async () => {
      try {
        await joinRoom({ roomId });
        const result = await fetchRoomToken({
          roomId: roomId as string,
          topicId: room.topicId as string,
          userId: currentUser._id as string,
          userName: currentUser.name ?? 'Anonymous',
          participantMetadata,
        });
        if (!cancelled) {
          setServerUrl(result.serverUrl);
          setToken(result.token);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to join room');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [audioReady, roomId]);

  const handleDisconnect = useCallback(async () => {
    KeepAwake.deactivateKeepAwake();
    try {
      await leaveRoom({ roomId });
    } catch (e) {
      console.warn('Leave room error:', e);
    }
    router.back();
  }, [roomId, leaveRoom, router]);

  if (loading || !audioReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAD40B',
        }}
      >
        <Spinner size='lg' variant='circle' color='#000' />
        <Text style={[styles.loadingTitle, { color: '#000' }]}>
          {!audioReady ? 'Preparing Audio' : 'Joining Room'}
        </Text>
        <Text style={[styles.loadingSubtitle, { color: 'rgba(0,0,0,0.5)' }]}>
          Connecting you and Orca AI…
        </Text>
      </View>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAD40B',
        }}
      >
        <Text style={{ fontSize: 52 }}>🚫</Text>
        <Text style={[styles.loadingTitle, { color: '#000' }]}>
          Connection Failed
        </Text>
        <Text style={[styles.loadingSubtitle, { color: 'rgba(0,0,0,0.5)' }]}>
          {error ?? 'Failed to connect'}
        </Text>
        <View style={{ width: '80%', marginTop: 28 }}>
          <OrcaButton
            onPress={() => router.back()}
            label='Go Back'
            variant='red'
          />
        </View>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
      options={{ adaptiveStream: false }}
    >
      <RoomView
        room={room}
        currentUser={currentUser}
        roomId={roomId}
        onLeave={handleDisconnect}
      />
    </LiveKitRoom>
  );
};

/* ═══════════════ */
/*    RoomView     */
/* ═══════════════ */
type RoomViewProps = {
  room: RoomData;
  currentUser: Doc<'users'>;
  roomId: Id<'rooms'>;
  onLeave: () => void;
};

const RoomView = ({ room, currentUser, roomId, onLeave }: RoomViewProps) => {
  const insets = useSafeAreaInsets();
  const { localParticipant } = useLocalParticipant();
  const lkRoom = useRoomContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showTranscript, setShowTranscript] = useState(false);

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    lkRoom?.state ?? ConnectionState.Disconnected,
  );
  const isConnected = connectionState === ConnectionState.Connected;

  useEffect(() => {
    if (!lkRoom) return;
    const onStateChange = (state: ConnectionState) => setConnectionState(state);
    lkRoom.on(RoomEvent.ConnectionStateChanged, onStateChange);
    setConnectionState(lkRoom.state);
    return () => {
      lkRoom.off(RoomEvent.ConnectionStateChanged, onStateChange);
    };
  }, [lkRoom]);

  const toggleMuteMutation = useMutation(api.rooms.toggleMute);
  const isMuted = room.isMuted;

  const micInitializedRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const applyMicState = useCallback(
    async (muted: boolean) => {
      if (!localParticipant || !lkRoom) return;
      try {
        const existingPub = localParticipant.getTrackPublication(
          Track.Source.Microphone,
        );
        const trackEnded =
          existingPub?.track?.mediaStreamTrack?.readyState === 'ended';
        if (!existingPub || trackEnded) {
          await localParticipant.setMicrophoneEnabled(true);
        }
        const pub = localParticipant.getTrackPublication(
          Track.Source.Microphone,
        );
        if (!pub) return;
        const mediaTrack = pub.track?.mediaStreamTrack;
        if (mediaTrack) mediaTrack.enabled = !muted;
        if (muted) await pub.mute();
        else await pub.unmute();
      } catch (err) {
        console.warn('[applyMicState] error:', err);
      }
    },
    [localParticipant, lkRoom],
  );

  useEffect(() => {
    if (!localParticipant || !isConnected) return;
    if (!micInitializedRef.current) {
      micInitializedRef.current = true;
      applyMicState(isMuted);
      return;
    }
    applyMicState(isMuted);
  }, [isMuted, isConnected, localParticipant, applyMicState]);

  useEffect(() => {
    if (!lkRoom) return;
    const onReconnected = () => {
      micInitializedRef.current = false;
      applyMicState(isMutedRef.current);
    };
    lkRoom.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      lkRoom.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [lkRoom, applyMicState]);

  const handleToggleMic = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleMuteMutation({ roomId });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const GRID_PADDING = 16;
  const GRID_GAP = 12;
  const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAD40B' }}>
      {/* Top nav */}
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
        <Avatar
          size={42}
          image={currentUser?.image}
          name={currentUser?.name}
          onPress={() => router.push('/profile')}
        />
      </View>

      {/* Main body */}
      <View style={[styles.body, { marginTop: insets.top + 70 }]}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {room.title}
            </Text>
            {room.topic ? (
              <Text style={styles.roomTopic} numberOfLines={1}>
                {room.topic}
              </Text>
            ) : null}
          </View>

          {!isConnected ? (
            <View style={styles.badge}>
              <Spinner size='sm' variant='circle' color='#FAD40B' />
              <Text
                style={{ color: '#FAD40B', fontSize: 12, fontWeight: '800' }}
              >
                {connectionState === ConnectionState.Reconnecting
                  ? 'Reconnecting…'
                  : 'Connecting…'}
              </Text>
            </View>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.countBadgeText}>🤖</Text>
              <View style={styles.liveDot} />
              <View style={styles.countBadge}>
                <Users size={12} color='#FFF' />
                <Text style={styles.countBadgeText}>
                  {room.participantCount}/{room.maxParticipants}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* AI Agent Visualization */}
        <AgentSection />

        {/* Transcript or Participant Grid */}
        {showTranscript ? (
          <TranscriptPanel onClose={() => setShowTranscript(false)} />
        ) : (
          <FlatList
            data={room.participants}
            numColumns={2}
            keyExtractor={(item) => item._id as string}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: 160 + insets.bottom },
            ]}
            columnWrapperStyle={{ gap: GRID_GAP }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RoomParticipantCard
                participant={item}
                isCurrentUser={item.userId === currentUser._id}
                cardWidth={CARD_WIDTH}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyParticipants}>
                <Text style={styles.emptyParticipantsText}>
                  Waiting for participants…
                </Text>
              </View>
            )}
          />
        )}

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <SquishyControlButton
            onPress={onLeave}
            label='Leave'
            icon={<Phone size={24} color='#FFF' strokeWidth={2.5} />}
            variant='red'
          />
          <SquishyControlButton
            onPress={() => setShowTranscript(!showTranscript)}
            label='Chat'
            icon={
              <MessageSquare
                size={24}
                color={showTranscript ? '#FAD40B' : '#000'}
                strokeWidth={2.5}
              />
            }
            variant={showTranscript ? 'dark' : 'yellow'}
          />
          <SquishyControlButton
            onPress={handleToggleMic}
            label={isMuted ? 'Unmute' : 'Mute'}
            icon={
              isMuted ? (
                <MicOff size={24} color='#FFF' strokeWidth={2.5} />
              ) : (
                <Mic size={24} color='#000' strokeWidth={2.5} />
              )
            }
            variant={isMuted ? 'dark' : 'yellow'}
          />
        </View>
      </View>
    </View>
  );
};

/* ══════════════════ */
/*  AI Agent Section  */
/* ══════════════════ */
const AgentSection = () => {
  const { state, microphoneTrack } = useAgent();
  const [barWidth, setBarWidth] = useState(0);
  const [barBorderRadius, setBarBorderRadius] = useState(0);

  const isActive = state === 'speaking';
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withTiming(1.08, { duration: 600 }),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const agentStateLabel = () => {
    switch (state) {
      case 'speaking':
        return '🗣️ Speaking…';
      case 'listening':
        return '👂 Listening…';
      case 'thinking':
        return '💭 Thinking…';
      case 'initializing':
        return '⚙️ Initializing…';
      default:
        return '⏳ Connecting…';
    }
  };

  return (
    <View style={styles.agentSection}>
      <View style={styles.agentInner}>
        {/* Pulsing AI avatar */}
        <Animated.View style={[styles.agentAvatarWrap, pulseStyle]}>
          <View
            style={[
              styles.agentAvatarRing,
              isActive && styles.agentAvatarRingActive,
            ]}
          >
            <View style={styles.agentAvatar}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ width: 52, height: 52 }}
                contentFit='contain'
              />
            </View>
          </View>
        </Animated.View>

        {/* Text + visualizer */}
        <View style={styles.agentTextWrap}>
          <Text style={styles.agentName}>Orca AI</Text>
          <Text style={styles.agentStatus}>{agentStateLabel()}</Text>
          <Text style={styles.agentRole}>Host & Language Coach</Text>
        </View>

        {/* Bar visualizer */}
        <View
          style={styles.barWrap}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setBarWidth(h * 0.18);
            setBarBorderRadius(h * 0.18);
          }}
        >
          <BarVisualizer
            state={state}
            barCount={5}
            trackRef={microphoneTrack}
            options={{
              minHeight: 0.1,
              barWidth,
              barColor: isActive ? '#FAD40B' : '#333',
              barBorderRadius,
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>
    </View>
  );
};

/* ══════════════════ */
/*  Transcript Panel  */
/* ══════════════════ */
const TranscriptPanel = ({ onClose }: { onClose: () => void }) => {
  const { messages } = useSessionMessages();
  const { localParticipant } = useLocalParticipant();

  return (
    <View style={styles.transcriptPanel}>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(_, i) => `msg-${i}`}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => {
          const isLocal = item.from === localParticipant;
          const isAgent = !isLocal && item.from?.identity?.startsWith('agent');
          return (
            <View
              style={[
                styles.msgBubble,
                isLocal
                  ? styles.msgBubbleLocal
                  : isAgent
                    ? styles.msgBubbleAgent
                    : styles.msgBubbleOther,
              ]}
            >
              {!isLocal && (
                <Text style={styles.msgAuthor}>
                  {isAgent ? '🤖 Orca AI' : (item.from?.name ?? 'Participant')}
                </Text>
              )}
              <Text style={[styles.msgText, isLocal && styles.msgTextLocal]}>
                {item.message}
              </Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Text style={{ color: '#555', fontSize: 13 }}>
              Conversation will appear here
            </Text>
          </View>
        )}
      />
    </View>
  );
};

/* ═══════════════════════ */
/*  Participant Card       */
/* ═══════════════════════ */
type ParticipantData = RoomData['participants'][0];

const RoomParticipantCard = ({
  participant,
  isCurrentUser,
  cardWidth,
}: {
  participant: ParticipantData;
  isCurrentUser: boolean;
  cardWidth: number;
}) => {
  const initials = (participant.user.name || 'A')
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const ringScale = useSharedValue(1);

  useEffect(() => {
    if (!participant.isMuted) {
      ringScale.value = withRepeat(
        withTiming(1.05, { duration: 1000 }),
        -1,
        true,
      );
    } else {
      ringScale.value = withTiming(1);
    }
  }, [participant.isMuted]);

  const AVATAR = 56;
  const langFlag =
    ALL_LANGUAGES.find((l) => l.code === participant.user.lang)?.flag ?? '';

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.card, { width: cardWidth }]}
    >
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <View
          style={[
            styles.cardAvatar,
            {
              width: AVATAR,
              height: AVATAR,
              borderRadius: AVATAR / 2,
              borderColor: isCurrentUser ? '#FAD40B' : 'rgba(255,255,255,0.1)',
            },
          ]}
        >
          {participant.user.image ? (
            <Image
              source={{ uri: participant.user.image }}
              style={StyleSheet.absoluteFillObject}
              contentFit='cover'
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.avatarFallback,
                {
                  backgroundColor: isCurrentUser
                    ? 'rgba(250,212,11,0.15)'
                    : '#1A1A28',
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitials,
                  { color: isCurrentUser ? '#FAD40B' : '#555' },
                ]}
              >
                {initials}
              </Text>
            </View>
          )}
        </View>

        {participant.isMuted && (
          <View style={styles.muteBadge}>
            <MicOff size={8} color='#FFF' />
          </View>
        )}
      </View>

      <Text style={styles.cardName} numberOfLines={1}>
        {isCurrentUser ? 'You' : participant.user.name} {langFlag}
      </Text>

      <View style={styles.cardStatus}>
        {participant.isMuted ? (
          <>
            <MicOff size={10} color='#FF3B30' strokeWidth={2.5} />
            <Text style={[styles.cardStatusText, { color: '#FF3B30' }]}>
              muted
            </Text>
          </>
        ) : (
          <>
            <View style={styles.speakingDot} />
            <Text style={[styles.cardStatusText, { color: '#1FD65F' }]}>
              live
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
};

/* ══════════════════════ */
/*  Squishy Control Btn  */
/* ══════════════════════ */
const CTRL_SIZE = 72;
const CTRL_SHADOW = 6;

const SquishyControlButton = ({
  onPress,
  label,
  icon,
  variant,
}: {
  onPress: () => void;
  label: string;
  icon: React.ReactNode;
  variant: 'yellow' | 'red' | 'dark';
}) => {
  const pressed = useSharedValue(0);

  const COLORS = {
    yellow: { face: '#FAD40B', shadow: '#C4A800', border: 'rgba(0,0,0,0.12)' },
    red: { face: '#FF3B30', shadow: '#C1271D', border: 'rgba(0,0,0,0.15)' },
    dark: {
      face: '#1C1C28',
      shadow: '#0A0A14',
      border: 'rgba(255,255,255,0.06)',
    },
  };

  const colors = COLORS[variant];

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pressed.value, [0, 1], [0, CTRL_SHADOW]) },
    ],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 14 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 14 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={styles.ctrlWrap}
    >
      <View style={[styles.ctrlShadow, { backgroundColor: colors.shadow }]} />
      <Animated.View
        style={[
          styles.ctrlFace,
          {
            backgroundColor: colors.face,
            borderWidth: 3,
            borderColor: colors.border,
          },
          faceStyle,
        ]}
      >
        {icon}
      </Animated.View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
};

/* ══════ Styles ══════ */
const styles = StyleSheet.create({
  loadingTitle: { marginTop: 12, fontSize: 22, fontWeight: '900' },
  loadingSubtitle: { marginTop: 4, fontSize: 14, fontWeight: '600' },

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
  roomTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  roomTopic: { color: '#555', fontSize: 13, marginTop: 3, fontWeight: '600' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FAD40B' },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  countBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  agentSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  agentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(250,212,11,0.06)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(250,212,11,0.15)',
  },
  agentAvatarWrap: {},
  agentAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(250,212,11,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarRingActive: {
    borderColor: '#FAD40B',
    shadowColor: '#FAD40B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  agentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAD40B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  agentTextWrap: { flex: 1 },
  agentName: { color: '#FAD40B', fontSize: 16, fontWeight: '900' },
  agentStatus: { color: '#777', fontSize: 13, fontWeight: '600', marginTop: 2 },
  agentRole: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  barWrap: { width: 80, height: 36 },

  transcriptPanel: { flex: 1, backgroundColor: '#0D0D14' },
  msgBubble: { maxWidth: '80%', borderRadius: 16, padding: 12, gap: 4 },
  msgBubbleLocal: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(250,212,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250,212,11,0.3)',
  },
  msgBubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(250,212,11,0.2)',
  },
  msgBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  msgAuthor: { color: '#FAD40B', fontSize: 11, fontWeight: '800' },
  msgText: { color: '#DDD', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  msgTextLocal: { color: '#FAD40B' },

  gridContent: { padding: 16, paddingTop: 20, gap: 12 },

  emptyParticipants: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyParticipantsText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },

  card: {
    flex: 1,
    backgroundColor: '#13131F',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
    gap: 4,
  },
  cardAvatar: { borderWidth: 2.5, overflow: 'hidden' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 20, fontWeight: '900' },
  muteBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#13131F',
  },
  cardName: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  speakingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1FD65F',
  },

  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 24,
    paddingHorizontal: 40,
    gap: 56,
  },
  ctrlWrap: { alignItems: 'center', gap: 10, paddingBottom: CTRL_SHADOW },
  ctrlShadow: {
    position: 'absolute',
    top: CTRL_SHADOW,
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    borderRadius: CTRL_SIZE / 2,
  },
  ctrlFace: {
    width: CTRL_SIZE,
    height: CTRL_SIZE,
    borderRadius: CTRL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlLabel: {
    color: '#555',
    fontSize: 12,
    fontWeight: '800',
    marginTop: CTRL_SHADOW,
    letterSpacing: 0.3,
  },
});
