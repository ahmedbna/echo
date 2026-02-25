import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Not authenticated');

    const topics = await ctx.db.query('topics').order('desc').collect();

    return topics;
  },
});
