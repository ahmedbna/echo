import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/** Join the waitlist. Silently deduplicates by email. */
export const join = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { email, source }) => {
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();
    if (existing) return { alreadyJoined: true };
    await ctx.db.insert('waitlist', {
      email,
      joinedAt: Date.now(),
      notified: false,
      source: source ?? 'unknown',
    });
    return { alreadyJoined: false };
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('waitlist').collect();
    return all.length;
  },
});
