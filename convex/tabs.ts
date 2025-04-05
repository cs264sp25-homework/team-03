import {  v } from "convex/values";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { authenticationGuard } from "./guards/auth";
import { ownershipGuard } from "./guards/ownership_guards";
import { internal } from "./_generated/api";
import { internalQuery, internalMutation, internalAction } from "./_generated/server";



export const getAll = queryWithSession({
  args: {
    groupId: v.optional(v.id("tabGroups")), // Optional: get tabs for a specific group
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Query builder
    let query = ctx.db.query("tabs")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));
    
    // If groupId provided, filter by group
    if (args.groupId) {
      query = query.filter((q) => q.eq(q.field("groupId"), args.groupId));
    }
    
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


export const create = mutationWithSession({
  args: {
    url: v.string(),
    name: v.optional(v.string()),
    groupId: v.optional(v.id("tabGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // If groupId provided, verify it exists and belongs to user
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");
      ownershipGuard(userId, group.userId);
    }

    // Create the tab
    const tabId = await ctx.db.insert("tabs", {
      userId,
      groupId: args.groupId,
      url: args.url,
      name: args.name,
      content: undefined,
      error: undefined,
    });

    return tabId;
  },
});

export const update = mutationWithSession({
  args: {
    tabId: v.id("tabs"),
    url: v.optional(v.string()),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    groupId: v.optional(v.id("tabGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const tab = await ctx.db.get(args.tabId);
    if (!tab) throw new Error("Tab not found");

    // Use ownership guard
    ownershipGuard(userId, tab.userId);

    // If changing group, verify new group exists and belongs to user
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");
      ownershipGuard(userId, group.userId);
    }
    
    // Update the tab
    const { tabId, ...updates } = args;
    await ctx.db.patch(tabId, updates);
  },
});


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

