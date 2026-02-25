// components/rooms/new-room.tsx
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
  topicEmoji,
  topicTitle,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, topic: string, agentInstructions: string) => void;
  creating: boolean;
  topicEmoji?: string;
  topicTitle?: string;
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a room title');
      return;
    }
    onSubmit(title.trim(), topic.trim(), agentInstructions.trim());
    setTitle('');
    setTopic('');
    setAgentInstructions('');
  };

  const handleClose = () => {
    onClose();
    setTitle('');
    setTopic('');
    setAgentInstructions('');
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={handleClose}
      snapPoints={[0.85]}
      style={{ backgroundColor: '#FAD40B' }}
    >
      <KeyboardAwareScrollView bottomOffset={46}>
        <View style={{ paddingBottom: 46 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24, gap: 4 }}>
            <Text style={{ fontSize: 40 }}>{topicEmoji ?? '🤖'}</Text>
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
            {topicTitle ? (
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 12,
                  marginTop: 2,
                }}
              >
                <Text
                  style={{ color: '#000', fontSize: 13, fontWeight: '700' }}
                >
                  {topicTitle}
                </Text>
              </View>
            ) : null}
            <Text
              style={{
                color: '#555',
                fontSize: 13,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 4,
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

          {/* Fields */}
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

            <SquishyInput
              value={agentInstructions}
              placeholder='AI Agent Instructions (optional) — e.g. "Focus on past tense verbs, correct gently"'
              onChangeText={setAgentInstructions}
              autoCapitalize='sentences'
              icon='🤖'
              variant='yellow'
            />

            <Text
              style={{
                color: 'rgba(0,0,0,0.4)',
                fontSize: 11,
                fontWeight: '600',
                marginTop: -6,
                paddingHorizontal: 4,
              }}
            >
              Customize how Orca AI behaves in this specific room. Leave empty
              to use default coaching style.
            </Text>
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginTop: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <OrcaButton onPress={handleClose} label='Close' variant='red' />
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
