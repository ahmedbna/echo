import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { Assistant } from './agent.js';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    // Step 1: Connect to the room first
    await ctx.connect();

    // Step 2: Wait for the first participant to join
    const participant = await ctx.waitForParticipant();

    const attrs = participant.attributes ?? {};
    console.log('✅ Participant Attributes:', JSON.stringify(attrs, null, 2));

    // Step 3: Parse metadata sent by the mobile app
    let metadata: Record<string, any> = {};
    try {
      metadata = JSON.parse(participant.metadata ?? '{}');
    } catch {
      console.warn('⚠️ Failed to parse participant metadata');
    }

    console.log('✅ Participant Metadata:', JSON.stringify(metadata, null, 2));

    // The app sends greetingInstructions + roomInstructions
    const greetingInstructions =
      metadata.greetingInstructions ??
      'Greet the group warmly and introduce yourself as Orca, the AI language coach.';

    const roomInstructions =
      metadata.roomInstructions ??
      'You are Orca, an expert language coach moderating a group discussion. Be encouraging, correct mistakes gently, and keep the conversation flowing.';

    const learningLanguage = metadata.learningLanguage ?? 'English';
    const nativeLanguage = metadata.nativeLanguage ?? 'English';

    console.log('✅ Learning language:', learningLanguage);
    console.log('✅ Native language:', nativeLanguage);

    // Step 4: Create the agent session with correct instructions
    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({
        voice: 'marin',
        // model: 'gpt-4o-realtime-preview',
      }),
    });

    await session.start({
      agent: new Assistant(roomInstructions),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    // Step 5: Send the greeting
    const handle = session.generateReply({
      instructions: greetingInstructions,
    });

    await handle.waitForPlayout();
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
