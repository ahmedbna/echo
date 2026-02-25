// components/background.tsx
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Doc } from '@/convex/_generated/dataModel';
import { useColor } from '@/hooks/useColor';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { Seafloor } from '@/components/orca/seafloor';
import { View } from '@/components/ui/view';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const Background = ({
  user,
  swim = false,
  study = false,
  children,
}: {
  user?: Doc<'users'>;
  swim?: boolean;
  study?: boolean;
  children: React.ReactNode;
}) => {
  const yellow = useColor('orca');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  return (
    <View style={{ flex: 1, backgroundColor: yellow }} pointerEvents='box-none'>
      <LinearGradient
        colors={[
          '#FAD40B',
          'rgba(250, 212, 11, 0.5)',
          'rgba(250, 212, 11, 0.01)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 120,
          zIndex: 10,
        }}
      />

      {/* Header */}
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
            if (router.canDismiss()) {
              router.dismissAll();
            }
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

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
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
            onPress={() => router.push('/notifications')}
          >
            <Text style={{ fontSize: 36 }}>🔔</Text>
            {unreadCount !== undefined && unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -4,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: '#FF453A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: '900',
                    lineHeight: 12,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Button>

          <Avatar
            size={42}
            image={user?.image}
            name={user?.name}
            onPress={() => router.push('/profile')}
          />
        </View>
      </View>

      {/* Background Elements */}
      <Clouds />
      <Bubbles />

      {!study ? <Shark /> : null}
      {!study ? <Jellyfish /> : null}

      <Seafloor speed={swim ? 7000 : 0} bottom={insets.bottom + 240} />

      <View
        style={{
          paddingBottom: insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F6C90E',
          paddingHorizontal: 16,
          height: insets.bottom + 240,
          zIndex: 44,
        }}
      />

      {children}
    </View>
  );
};
