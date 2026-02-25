import { useLocalSearchParams } from 'expo-router';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { Room } from '@/components/rooms/room';
import { RoomConnectionProvider } from '@/components/rooms/useRoomConnection';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'rooms'> }>();
  const room = useQuery(api.rooms.get, { roomId: id });
  const user = useQuery(api.users.get, {});

  if (room === undefined || user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
        }}
      >
        <Spinner size='lg' variant='circle' color='#FAD40B' />
      </View>
    );
  }

  if (room === null || user === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0F',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>Meet not found</Text>
      </View>
    );
  }

  return (
    <RoomConnectionProvider user={user}>
      <Room room={room} currentUser={user} roomId={id} />
    </RoomConnectionProvider>
  );
}
