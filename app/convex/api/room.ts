// convex/api/meet.ts
// HTTP handler for generating LiveKit tokens for Meet rooms

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

    if (!body.roomId || !body.topicId || !body.userId || !body.userName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: roomId, topicId, userId, userName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await ctx.runAction(api.api.roomNode.generateRoomToken, {
      roomId: body.roomId,
      topicId: body.topicId,
      userId: body.userId,
      userName: body.userName,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Meet token error:', error);
    return new Response(
      JSON.stringify({ error: 'Error generating meet token' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
