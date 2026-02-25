// components/rooms/useRoomConnection.tsx
// Provides the LiveKit agent session specifically for Room rooms.
// The agent receives participant info and lesson context via metadata,
// enabling speaker-aware AI moderation.

import { TokenSource } from 'livekit-client';
import { createContext, useContext, useMemo, useState } from 'react';
import { SessionProvider, useSession } from '@livekit/components-react';
import { Doc } from '@/convex/_generated/dataModel';
import { ALL_LANGUAGES } from '@/constants/languages';

interface RoomConnectionContextType {
  isConnectionActive: boolean;
  connect: () => void;
  disconnect: () => void;
}

const RoomConnectionContext = createContext<RoomConnectionContextType>({
  isConnectionActive: false,
  connect: () => {},
  disconnect: () => {},
});

export function useRoomConnection() {
  const ctx = useContext(RoomConnectionContext);
  if (!ctx)
    throw new Error(
      'useRoomConnection must be used within RoomConnectionProvider',
    );
  return ctx;
}

interface RoomConnectionProviderProps {
  user: Doc<'users'>;
  children: React.ReactNode;
}

export function RoomConnectionProvider({
  user,
  children,
}: RoomConnectionProviderProps) {
  const [isConnectionActive, setIsConnectionActive] = useState(false);

  const learningLanguage =
    ALL_LANGUAGES.find((lang) => lang.code === user.learningLanguage)?.name ||
    'English';
  const nativeLanguage =
    ALL_LANGUAGES.find((lang) => lang.code === user.nativeLanguage)?.name ||
    'English';

  // Greeting for the group when agent first joins
  const greetingInstructions = `
Speak in ${learningLanguage}.
Greet the group warmly. Introduce yourself as "Orca", their AI language coach for this session. you'll guide the discussion.
Invite everyone to introduce themselves in ${learningLanguage}.
Keep it brief — two to three sentences.
`;

  // Full multi-participant moderator instructions
  const roomInstructions = `
ROLE
You are "Orca", an expert and encouraging ${learningLanguage} language coach moderating a group discussion.



SPEAKER AWARENESS
- You are in a room with multiple speakers. Pay close attention to WHO is speaking.
- When someone finishes speaking, address them by name in your response.
- Track who has spoken and who hasn't. Invite quieter participants to contribute.
- If two people speak at once, acknowledge both.

LANGUAGE RULES
- Conduct the session primarily in ${learningLanguage}.
- Use ${nativeLanguage} ONLY for explaining mistakes or grammar.
- Never mix languages in a single sentence.

MODERATION FLOW
1. Start with a warm-up: ask each participant to introduce themselves in ${learningLanguage}.
2. Present one lesson sentence at a time to the group.
3. Ask for volunteers to practice or call on specific participants by name.
4. Give individual feedback after each attempt.
5. Celebrate correct pronunciation. Gently correct mistakes.
6. Move to the next sentence once 2-3 participants have practiced it.
7. End each sentence with a summary of common mistakes and the correct form.

FEEDBACK STYLE
- Direct your feedback at the person who just spoke: "Great job, [Name]!" or "[Name], try saying it more slowly."
- For corrections: say the correct form once clearly, then ask them to repeat.
- Keep energy high and positive.

GROUP DYNAMICS
- If the conversation stalls, prompt a specific person: "[Name], what do you think?"
- If someone dominates, invite others: "Let's hear from someone else. [Name], your turn!"
- Periodically summarize progress: "We've covered X sentences. Let's keep going!"

BEHAVIOR CONSTRAINTS
- Never invent new sentences.
- Stay focused on pronunciation and speaking practice.
- Keep responses concise — you are in a live audio session.
`;

  const tokenSource = TokenSource.endpoint(
    `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/getToken`,
  );

  // The room name must match what the backend generates for this room session.
  // The participant metadata carries lesson/room context to the agent.
  const session = useSession(tokenSource, {
    roomName: `room-`,
    agentName: `room-orca-`,
    participantIdentity: `room-`,
    participantName: user.name ?? 'Participant',
    participantMetadata: JSON.stringify({
      greetingInstructions,
      roomInstructions,
      lessonTitle: 'lesson.title',
      learningLanguage,
      nativeLanguage,
    }),
    participantAttributes: {},
  });

  const { start: startSession, end: endSession } = session;

  const value = useMemo(
    () => ({
      isConnectionActive,
      connect: () => {
        setIsConnectionActive(true);
        startSession();
      },
      disconnect: () => {
        setIsConnectionActive(false);
        endSession();
      },
    }),
    [startSession, endSession, isConnectionActive],
  );

  return (
    <SessionProvider session={session}>
      <RoomConnectionContext.Provider value={value}>
        {children}
      </RoomConnectionContext.Provider>
    </SessionProvider>
  );
}
