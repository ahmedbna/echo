import { Rooms } from '@/components/rooms/rooms';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';

export default function RoomsScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'topics'> }>();
  const user = useQuery(api.users.get, {});
  const lesson = useQuery(api.topics.get, { lessonId: id });

  if (lesson === undefined || user === undefined) {
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

  if (lesson === null || user === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Lesson Not Found</Text>
      </View>
    );
  }

  return (
    <Rooms
      user={user}
      lessonId={lesson._id}
      lessonTitle={lesson.title}
      lesson={lesson}
    />
  );
}
