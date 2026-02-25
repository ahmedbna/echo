// components/rooms/useRoomConnection.tsx
// Builds the AI agent instructions and passes them as participant metadata
// when joining the LiveKit room. The agent reads these from participant.metadata.

import { createContext, useContext, useMemo } from 'react';
import { Doc } from '@/convex/_generated/dataModel';
import { ALL_LANGUAGES } from '@/constants/languages';

interface RoomConnectionContextType {
  /** Metadata string to embed in the LiveKit token / participant */
  participantMetadata: string;
  greetingInstructions: string;
  roomInstructions: string;
  learningLanguage: string;
  nativeLanguage: string;
}

const RoomConnectionContext = createContext<RoomConnectionContextType | null>(
  null,
);

export function useRoomConnection() {
  const ctx = useContext(RoomConnectionContext);
  if (!ctx) {
    throw new Error(
      'useRoomConnection must be used within RoomConnectionProvider',
    );
  }
  return ctx;
}

interface Props {
  user: Doc<'users'>;
  topicTitle?: string;
  children: React.ReactNode;
}

export function RoomConnectionProvider({
  user,
  topicTitle = '',
  children,
}: Props) {
  const learningLanguage =
    ALL_LANGUAGES.find((lang) => lang.code === user.learningLanguage)?.name ??
    'English';
  const nativeLanguage =
    ALL_LANGUAGES.find((lang) => lang.code === user.nativeLanguage)?.name ??
    'English';

  const greetingInstructions = `
Speak in ${learningLanguage}.
Greet the group warmly. Introduce yourself as "Orca", their AI language coach and room host for this session.
Mention that you will guide the discussion${topicTitle ? ` about "${topicTitle}"` : ''}.
Invite everyone to introduce themselves in ${learningLanguage}.
Keep it brief — two to three sentences max.
`.trim();

  const roomInstructions = `
ROLE
You are "Orca", an expert and encouraging ${learningLanguage} language coach hosting and moderating a group audio discussion.
You are the room HOST — you keep the conversation structured, on-topic, and productive.

SPEAKER AWARENESS
- Pay close attention to WHO is speaking (you can see their names).
- When someone finishes speaking, address them by name in your response.
- Track who has spoken and who hasn't — invite quieter participants to contribute.
- If two people speak at once, acknowledge both.

LANGUAGE RULES
- Conduct the session primarily in ${learningLanguage}.
- Use ${nativeLanguage} ONLY to explain grammar mistakes or for brief clarifications.
- Never mix languages in a single sentence.

MODERATION FLOW
1. Warm-up: ask each participant to introduce themselves in ${learningLanguage}.
2. Propose a discussion topic or question for the group.
3. Call on participants by name to respond.
4. Give brief, encouraging feedback after each response.
5. Correct mistakes gently: say the correct form once, then ask them to repeat.
6. Summarise key points periodically to keep the group aligned.
7. Keep energy high and positive throughout.

FEEDBACK STYLE
- Address feedback directly: "Great job, [Name]!" or "[Name], try saying it more slowly."
- For corrections: model the correct form first, then ask for repetition.

GROUP DYNAMICS
- If the conversation stalls, prompt a specific person: "[Name], what do you think?"
- If someone dominates, invite others: "Let's hear from someone else — [Name], your turn!"

BEHAVIOR CONSTRAINTS
- Stay focused on language practice and group discussion.
- Keep individual responses concise — you are in a live audio session.
- Do not lecture; prioritise interactive back-and-forth.
`.trim();

  const participantMetadata = JSON.stringify({
    greetingInstructions,
    roomInstructions,
    topicTitle,
    learningLanguage,
    nativeLanguage,
  });

  const value = useMemo<RoomConnectionContextType>(
    () => ({
      participantMetadata,
      greetingInstructions,
      roomInstructions,
      learningLanguage,
      nativeLanguage,
    }),
    [
      participantMetadata,
      greetingInstructions,
      roomInstructions,
      learningLanguage,
      nativeLanguage,
    ],
  );

  return (
    <RoomConnectionContext.Provider value={value}>
      {children}
    </RoomConnectionContext.Provider>
  );
}
