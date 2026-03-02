// convex/topics.ts
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const DEFAULT_TOPICS = [
  {
    title: 'Sports',
    emoji: '⚽',
    description: 'Football, basketball, tennis and more',
    sortOrder: 1,
  },
  {
    title: 'Food & Cooking',
    emoji: '🍕',
    description: 'Recipes, restaurants, and culinary adventures',
    sortOrder: 2,
  },
  {
    title: 'Travel',
    emoji: '✈️',
    description: 'Destinations, tips, and travel stories',
    sortOrder: 3,
  },
  {
    title: 'Technology',
    emoji: '💻',
    description: 'Tech news, gadgets, and innovation',
    sortOrder: 4,
  },
  {
    title: 'Movies & TV',
    emoji: '🎬',
    description: 'Reviews, recommendations, and discussions',
    sortOrder: 5,
  },
  {
    title: 'Music',
    emoji: '🎵',
    description: 'Artists, albums, genres, and concerts',
    sortOrder: 6,
  },
  {
    title: 'Science',
    emoji: '🔬',
    description: 'Scientific discoveries and curiosities',
    sortOrder: 7,
  },
  {
    title: 'Business',
    emoji: '💼',
    description: 'Entrepreneurship, career, and finance',
    sortOrder: 8,
  },
  {
    title: 'Health & Fitness',
    emoji: '💪',
    description: 'Wellness, workouts, and healthy living',
    sortOrder: 9,
  },
  {
    title: 'Art & Culture',
    emoji: '🎨',
    description: 'Visual arts, literature, and culture',
    sortOrder: 10,
  },
  {
    title: 'Gaming',
    emoji: '🎮',
    description: 'Video games, board games, and esports',
    sortOrder: 11,
  },
  {
    title: 'Nature',
    emoji: '🌿',
    description: 'Environment, animals, and the outdoors',
    sortOrder: 12,
  },
];

/** Get all topics ordered by sortOrder */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const topics = await ctx.db
      .query('topics')
      .withIndex('by_sort_order')
      .order('asc')
      .collect();

    // Fallback: if no topics yet, return empty — seed via seedTopics mutation
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

/** Seed default topics (idempotent — skips if already exists) */
export const seedTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const existing = await ctx.db.query('topics').collect();
    const existingTitles = new Set(existing.map((t) => t.title));

    let created = 0;
    for (const topic of DEFAULT_TOPICS) {
      if (!existingTitles.has(topic.title)) {
        await ctx.db.insert('topics', topic);
        created++;
      }
    }

    return { created, skipped: DEFAULT_TOPICS.length - created };
  },
});
