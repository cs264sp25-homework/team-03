import { v } from "convex/values";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { authenticationGuard } from "./guards/auth";
import { ownershipGuard } from "./guards/ownership_guards";
import { internal } from "./_generated/api";
import { internalQuery, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
//import { internalMutation,internalAction } from "./_generated/server";

export const getAll = queryWithSession({
  args: {
   
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Query builder
    let query = ctx.db.query("tabs")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));
    
  
    
    return query.collect();
  },
});

export const getOne = queryWithSession({
  args: {
    tabId: v.id("tabs"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const tab = await ctx.db.get(args.tabId);
    if (!tab) return null;

    // Use ownership guard instead of manual check
    ownershipGuard(userId, tab.userId);
    
    return tab;
  },
});


export const getOneInternal = internalQuery({
  args: {
    tabId: v.id("tabs"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.tabId);
  },
});

export const getOneByUrl = mutationWithSession({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Find tab by URL for this user
    const tab = await ctx.db
      .query("tabs")
      .withIndex("by_user_and_url", (q) => 
        q.eq("userId", userId).eq("url", args.url)
      )
      .first();

    if (!tab) return null;
    
    return tab;
  },
});


export const create = mutationWithSession({
  args: {
    url: v.string(),
    name: v.optional(v.string()),
    content: v.optional(v.string()),

  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
   
   
    // Check if tab already exists for this user
    const existingTab = await ctx.db
      .query("tabs")
      .withIndex("by_user_and_url", (q) => 
        q.eq("userId", userId).eq("url", args.url)
      )
      .first();

    if (existingTab) {
      // Update existing tab instead of creating a new one
      await ctx.db.patch(existingTab._id, {
        name: args.name,
        content: args.content,

      });
      return existingTab._id;
    }
  
    // Create new tab if it doesn't exist
    const tabId = await ctx.db.insert("tabs", {
      userId,
      url: args.url,
      name: args.name,
      content: args.content,
      error: undefined,
      status: "pending",
    });

   
    // Schedule vectorization if content is provided
    if (args.content) {
      ctx.scheduler.runAfter(0, internal.vectorize.process, {
        tabId,
        text: args.content,
      });
    }

    return tabId;
  },
});


export const update = mutationWithSession({
  args: {
    tabId: v.id("tabs"),
    url: v.optional(v.string()),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
   
    const tab = await ctx.db.get(args.tabId);
    if (!tab) throw new Error("Tab not found");

    // Use ownership guard
    ownershipGuard(userId, tab.userId);

    if (args.content) {
      console.log("Scheduling vectorization for tab in update", args.tabId);
      
      ctx.scheduler.runAfter(0, internal.vectorize.process, {
        tabId: args.tabId,
        text: args.content,
      });
    }

  
    // Update the tab
    const { tabId, ...updates } = args;
    await ctx.db.patch(tabId, updates);
  },
});

/*export const updateTabContent = internalMutation({
  args: {
    tabId: v.id("tabs"),
    content: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.tabId);
    if (!tab) {
      throw new Error("Tab not found");
    }

    const updates: any = {};
    if (args.content) updates.content = args.content;
    if (args.name) updates.name = args.name;

    await ctx.db.patch(args.tabId, updates);
    
    // Schedule vectorization if content is provided
    if (args.content) {
      
      ctx.scheduler.runAfter(0, internal.vectorize.process, {
        tabId: args.tabId,
        text: args.content,
      });
    }
    
    return true;
  },
});*/

export const remove = mutationWithSession({
  args: {
    tabId: v.id("tabs"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const tab = await ctx.db.get(args.tabId);
    if (!tab) throw new Error("Tab not found");

    // Use ownership guard
    ownershipGuard(userId, tab.userId);
    
    // Delete the tab
    await ctx.db.delete(args.tabId);
  },
});

export const updateTabText = mutation({
  args: {
    tabId: v.id("tabs"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.tabId);
    if (!tab) {
      throw new ConvexError({
        code: 404,
        message: "Tab not found",
      });
    }

    await ctx.db.patch(args.tabId, {
      content: args.text,
      status: "text extracted",
    });

    // Schedule an action to vectorize the tab content
    ctx.scheduler.runAfter(0, internal.vectorize.process, {
      tabId: args.tabId,
      text: args.text,
    });

    return true;
  },
});

export const updateTabStatus = mutation({
  args: {
    tabId: v.id("tabs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("text extracted"),
      v.literal("chunking"),
      v.literal("embedding"),
      v.literal("processed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.tabId);
    if (!tab) {
      throw new ConvexError({
        code: 404,
        message: "Tab not found",
      });
    }

    await ctx.db.patch(args.tabId, {
      status: args.status,
      error: args.error,
    });
  },
});

