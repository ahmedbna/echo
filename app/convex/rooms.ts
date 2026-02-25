// convex/rooms.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const MAX_PARTICIPANTS = 5;

/* -------------------------------------------------- */
/* LIST ACTIVE ROOMS FOR A TOPIC                       */
/* -------------------------------------------------- */
export const listByTopic = query({
  args: { topicId: v.id('topics') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_topic_status', (q) =>
        q.eq('topicId', args.topicId).eq('status', 'active'),
      )
      .order('desc')
      .collect();

    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const roomParticipants = await ctx.db
          .query('roomParticipants')
          .withIndex('by_room', (q) => q.eq('roomId', room._id))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        const participants = await Promise.all(
          roomParticipants.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            if (!user) return null;
            return {
              _id: p._id,
              userId: p.userId,
              roomId: p.roomId,
              isMuted: p.isMuted,
              isActive: p.isActive,
              joinedAt: p.joinedAt,
              name: user.name ?? 'Anonymous',
              image: user.image ?? null,
            };
          }),
        );

        const activeParticipants = participants.filter(
          (p): p is NonNullable<typeof p> => p !== null,
        );

        return {
          ...room,
          participants: activeParticipants,
          participantCount: activeParticipants.length,
          isFull: activeParticipants.length >= MAX_PARTICIPANTS,
        };
      }),
    );

    return roomsWithParticipants;
  },
});

/* -------------------------------------------------- */
/* GET SINGLE ROOM                                     */
/* -------------------------------------------------- */
export const get = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .collect();

    const activeParticipants = participants.filter((p) => p.isActive);

    const participantsWithUsers = await Promise.all(
      activeParticipants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user: {
            _id: user?._id,
            name: user?.name ?? 'Anonymous',
            image: user?.image ?? null,
            lang: user?.nativeLanguage ?? 'en',
          },
        };
      }),
    );

    const host = await ctx.db.get(room.hostId);
    const myParticipation = participants.find((p) => p.userId === userId);
    const topic = await ctx.db.get(room.topicId);
    if (!topic) return null;

    return {
      ...room,
      host: {
        _id: host?._id,
        name: host?.name ?? 'Anonymous',
        image: host?.image ?? null,
      },
      topic,
      participants: participantsWithUsers,
      participantCount: activeParticipants.length,
      isFull: activeParticipants.length >= MAX_PARTICIPANTS,
      maxParticipants: MAX_PARTICIPANTS,
      isMuted: myParticipation?.isMuted ?? false,
      isInRoom: myParticipation?.isActive ?? false,
    };
  },
});

/* -------------------------------------------------- */
/* CREATE ROOM                                         */
/* -------------------------------------------------- */
export const create = mutation({
  args: {
    topicId: v.id('topics'),
    title: v.string(),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const roomId = await ctx.db.insert('rooms', {
      title: args.title,
      topic: args.topic,
      topicId: args.topicId,
      hostId: userId,
      status: 'active',
      startedAt: Date.now(),
    });

    // Creator joins automatically
    await ctx.db.insert('roomParticipants', {
      roomId,
      userId,
      isMuted: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return roomId;
  },
});

/* -------------------------------------------------- */
/* JOIN ROOM                                           */
/* -------------------------------------------------- */
export const join = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== 'active')
      throw new Error('Room not available');

    const existing = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (existing) {
      if (!existing.isActive) {
        const activeParticipants = await ctx.db
          .query('roomParticipants')
          .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        if (activeParticipants.length >= MAX_PARTICIPANTS) {
          throw new Error(
            `Room is full (max ${MAX_PARTICIPANTS} participants)`,
          );
        }

        await ctx.db.patch(existing._id, {
          isActive: true,
          isMuted: false,
          joinedAt: Date.now(),
        });
      }
      return { participantId: existing._id };
    }

    // New participant — enforce limit
    const activeParticipants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    if (activeParticipants.length >= MAX_PARTICIPANTS) {
      throw new Error(`Room is full (max ${MAX_PARTICIPANTS} participants)`);
    }

    const participantId = await ctx.db.insert('roomParticipants', {
      roomId: args.roomId,
      userId,
      isMuted: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return { participantId };
  },
});

/* -------------------------------------------------- */
/* LEAVE ROOM                                          */
/* -------------------------------------------------- */
export const leave = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, { isActive: false });
    }

    const remaining = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const othersRemaining = remaining.filter((p) => p.userId !== userId);

    if (othersRemaining.length === 0) {
      await _deleteRoom(ctx, args.roomId);
      return { success: true, roomDeleted: true };
    }

    if (room.hostId === userId) {
      await ctx.db.patch(args.roomId, {
        hostId: othersRemaining[0].userId,
      });
    }

    return { success: true, roomDeleted: false };
  },
});

/* -------------------------------------------------- */
/* TOGGLE MUTE                                         */
/* -------------------------------------------------- */
export const toggleMute = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (!participant) throw new Error('Not in room');

    await ctx.db.patch(participant._id, { isMuted: !participant.isMuted });
    return { isMuted: !participant.isMuted };
  },
});

/* -------------------------------------------------- */
/* INTERNAL: delete room + all participant records     */
/* -------------------------------------------------- */
async function _deleteRoom(ctx: any, roomId: any) {
  const participants = await ctx.db
    .query('roomParticipants')
    .withIndex('by_room', (q: any) => q.eq('roomId', roomId))
    .collect();

  for (const p of participants) {
    await ctx.db.delete(p._id);
  }

  await ctx.db.delete(roomId);
}
