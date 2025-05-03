import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { authenticationGuard } from "./guards/auth";

// Get all favorites for the current user
export const getAll = queryWithSession({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await authenticationGuard(ctx, ctx.sessionId);
      
      return ctx.db
        .query("favorites")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();
    } catch (error) {
      // If authentication fails, return an empty array instead of throwing an error
      // This allows the UI to handle the unauthenticated state more gracefully
      console.log("User not authenticated yet, returning empty favorites list");
      return [];
    }
  },
});

// Check if a tab is favorited by the current user
export const isFavorite = queryWithSession({
  args: {
    tabId: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await authenticationGuard(ctx, ctx.sessionId);
      
      const favorite = await ctx.db
        .query("favorites")
        .withIndex("by_user_and_tab_id", (q) => 
          q.eq("userId", userId).eq("tabId", args.tabId)
        )
        .first();
      
      return favorite !== null;
    } catch (error) {
      // If authentication fails, return false instead of throwing an error
      console.log("User not authenticated yet, returning false for isFavorite");
      return false;
    }
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
    try {
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
    } catch (error) {
      // If authentication fails, throw a more descriptive error
      throw new ConvexError({
        message: "Please refresh the extension to initialize your session before adding favorites",
        code: 401,
      });
    }
  },
});

// Remove a tab from favorites
export const removeFavorite = mutationWithSession({
  args: {
    tabId: v.number(),
  },
  handler: async (ctx, args) => {
    try {
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
    } catch (error) {
      // If authentication fails, throw a more descriptive error
      throw new ConvexError({
        message: "Please refresh the extension to initialize your session before removing favorites",
        code: 401,
      });
    }
  },
});
