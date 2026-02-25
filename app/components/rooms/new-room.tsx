import React, { useState } from 'react';
import { Alert } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SquishyInput } from '@/components/squishy/squishy-input';
import { OrcaButton } from '@/components/squishy/orca-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export const NewRoom = ({
  visible,
  onClose,
  onSubmit,
  creating,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, topic: string) => void;
  creating: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a room title');
      return;
    }
    onSubmit(title.trim(), topic.trim());
    setTitle('');
    setTopic('');
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      snapPoints={[0.6]}
      style={{ backgroundColor: '#FAD40B' }}
    >
      <KeyboardAwareScrollView bottomOffset={46}>
        <View style={{ paddingBottom: 46 }}>
          <View style={{ alignItems: 'center', marginBottom: 24, gap: 4 }}>
            <Text style={{ fontSize: 40 }}>🤖</Text>
            <Text
              style={{
                color: '#000',
                fontSize: 24,
                fontWeight: '900',
                marginTop: 4,
              }}
            >
              Start a Room
            </Text>
            <Text
              style={{
                color: '#555',
                fontSize: 13,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Orca AI will join as moderator &amp; language coach
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
              }}
            >
              <Text style={{ color: '#555', fontSize: 12, fontWeight: '600' }}>
                Up to 5 participants + AI
              </Text>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#0ffa0b',
                }}
              />
            </View>
          </View>

          <View style={{ gap: 14 }}>
            <SquishyInput
              value={title}
              placeholder='Room Title'
              onChangeText={setTitle}
              autoCapitalize='sentences'
              icon='🎙️'
              variant='yellow'
            />
            <SquishyInput
              value={topic}
              placeholder='Discussion Topic (optional)'
              onChangeText={setTopic}
              autoCapitalize='sentences'
              icon='💬'
              variant='yellow'
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginTop: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <OrcaButton
                onPress={() => {
                  onClose();
                  setTitle('');
                  setTopic('');
                }}
                label='Close'
                variant='red'
              />
            </View>
            <View style={{ flex: 3 }}>
              <OrcaButton
                onPress={handleSubmit}
                disabled={creating || !title.trim()}
                loading={creating}
                label='Start Room'
                variant='green'
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
};
