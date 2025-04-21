import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";



//internally called by tabGroups.ts to get all tabs in a group
export const getTabsInGroup = internalQuery({
  args: { tabGroupId: v.id("tabGroups") },
  handler: async (ctx, args) => {
    // Get all tab IDs in the group
    const members = await ctx.db
      .query("tabGroupMembers")
      .withIndex("by_tab_group", q => q.eq("tabGroupId", args.tabGroupId))
      .collect();

    // Get the actual tab data
    const tabs = await Promise.all(
      members.map(member => ctx.db.get(member.tabId))
    );

    return tabs.filter((tab): tab is Doc<"tabs"> => tab !== null);
  }
});


export const getGroupsForTab = internalQuery({
  args: { tabId: v.id("tabs") },
  handler: async (ctx, args) => {
    // Get all groups for this tab
    const members = await ctx.db
      .query("tabGroupMembers")
      .withIndex("by_tab", q => q.eq("tabId", args.tabId))
      .collect();

    // Get the actual group data
    const groups = await Promise.all(
      members.map(member => ctx.db.get(member.tabGroupId))
    );

    return groups.filter((group): group is Doc<"tabGroups"> => group !== null);
  }
});

export const addTabToGroup = internalMutation({
  args: {
    tabId: v.id("tabs"),
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx, args) => {
    // Check if tab is already in group
    const existing = await ctx.db
      .query("tabGroupMembers")
      .withIndex("by_tab_group", q => q.eq("tabGroupId", args.tabGroupId))
      .filter(q => q.eq(q.field("tabId"), args.tabId))
      .first();

    if (existing) {
      throw new Error("Tab already in group");
    }

    // Add to junction table
    await ctx.db.insert("tabGroupMembers", {
      tabId: args.tabId,
      tabGroupId: args.tabGroupId,
      addedAt: Date.now()
    });
  }
});


export const removeTabFromGroup = internalMutation({
  args: {
    tabId: v.id("tabs"),
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx, args) => {
    // Find and remove the membership
    const member = await ctx.db
      .query("tabGroupMembers")
      .withIndex("by_tab_group", q => q.eq("tabGroupId", args.tabGroupId))
      .filter(q => q.eq(q.field("tabId"), args.tabId))
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }
  }
});


export const removeAllTabsFromGroup = internalMutation({
  args: {
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx, args) => {
    // Get all memberships for this group
    const members = await ctx.db
      .query("tabGroupMembers")
      .withIndex("by_tab_group", q => q.eq("tabGroupId", args.tabGroupId))
      .collect();

    // Delete all memberships
    await Promise.all(members.map(member => ctx.db.delete(member._id)));
  }
}); 