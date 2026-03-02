// app/rooms/[id].tsx
import { Rooms } from '@/components/rooms/rooms';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';

export default function RoomsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useQuery(api.users.get, {});
  const topic = useQuery(api.topics.getById, {
    topicId: id as Id<'topics'>,
  });

  if (topic === undefined || user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAD40B',
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (topic === null || user === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Topic Not Found</Text>
      </View>
    );
  }

  return (
    <Rooms
      user={user}
      topicId={topic._id}
      topicTitle={topic.title}
      topic={topic}
    />
  );
}
