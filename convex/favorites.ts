import { v } from "convex/values";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { authenticationGuard } from "./guards/auth";

// Get all favorites for the current user
export const getAll = queryWithSession({
  args: {},
  handler: async (ctx) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    return ctx.db
      .query("favorites")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Check if a tab is favorited by the current user
export const isFavorite = queryWithSession({
  args: {
    tabId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_tab_id", (q) => 
        q.eq("userId", userId).eq("tabId", args.tabId)
      )
      .first();
    
    return favorite !== null;
  },
});

// Add a tab to favorites
export const addFavorite = mutationWithSession({
  args: {
    tabId: v.number(),
    url: v.string(),
    title: v.string(),
    favIconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_tab_id", (q) => 
        q.eq("userId", userId).eq("tabId", args.tabId)
      )
      .first();
    
    if (existing) {
      return existing._id; // Already favorited
    }
    
    // Add to favorites
    return await ctx.db.insert("favorites", {
      userId,
      tabId: args.tabId,
      url: args.url,
      title: args.title,
      favIconUrl: args.favIconUrl,
    });
  },
});

// Remove a tab from favorites
export const removeFavorite = mutationWithSession({
  args: {
    tabId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_tab_id", (q) => 
        q.eq("userId", userId).eq("tabId", args.tabId)
      )
      .first();
    
    if (!favorite) {
      return false; // Not favorited
    }
    
    // Remove from favorites
    await ctx.db.delete(favorite._id);
    return true;
  },
});
