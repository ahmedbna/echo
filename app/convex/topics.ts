// convex/topics.ts
import { v } from 'convex/values';
import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/** Get all topics */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const topics = await ctx.db.query('topics').order('desc').collect();
    return topics;
  },
});

/** Get a single topic by ID */
export const getById = query({
  args: { topicId: v.id('topics') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const topic = await ctx.db.get(args.topicId);
    return topic ?? null;
  },
});
