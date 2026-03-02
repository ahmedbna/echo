// convex/api/room.ts
// HTTP handler for generating LiveKit tokens for audio rooms

import { httpAction } from '../_generated/server';
import { api } from '../_generated/api';

export const getRoomToken = httpAction(async (ctx, request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();

    // Only roomId, userId, and userName are strictly required.
    // topicId is optional (used for room scoping in the token name).
    if (!body.roomId || !body.userId || !body.userName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: roomId, userId, userName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await ctx.runAction(api.api.roomNode.generateRoomToken, {
      roomId: body.roomId,
      topicId: body.topicId ?? body.roomId, // fall back to roomId if topicId missing
      userId: body.userId,
      userName: body.userName,
      participantMetadata: body.participantMetadata,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Room token error:', error);
    return new Response(
      JSON.stringify({ error: 'Error generating room token' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
