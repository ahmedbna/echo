// convex/users.ts
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';

export const getId = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const user = await ctx.db.get(authId);
    if (!user) throw new Error('User not found');

    return user._id;
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const userId = args.userId ?? authId;

    const user = await ctx.db.get(userId);

    if (!user) throw new Error('User not found');

    return user;
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.number()),
    image: v.optional(v.union(v.string(), v.null())),
    nativeLanguage: v.optional(v.string()),
    learningLanguage: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    agentId: v.optional(v.string()),
    piperId: v.optional(v.id('piperModels')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    return ctx.db.patch(userId, args);
  },
});

const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};
